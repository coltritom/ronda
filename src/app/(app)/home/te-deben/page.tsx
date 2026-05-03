import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

interface Balance { userId: string; name: string; net: number }
interface Debt { fromId: string; fromName: string; toId: string; toName: string; amount: number }

function simplifyDebts(balances: Balance[]): Debt[] {
  const creditors = balances.filter((b) => b.net > 0.005).map((b) => ({ ...b }))
  const debtors   = balances.filter((b) => b.net < -0.005).map((b) => ({ ...b }))
  const result: Debt[] = []
  for (const debtor of debtors) {
    let owed = Math.abs(debtor.net)
    for (const creditor of creditors) {
      if (owed < 0.005 || creditor.net < 0.005) continue
      const pay = Math.min(owed, creditor.net)
      result.push({ fromId: debtor.userId, fromName: debtor.name, toId: creditor.userId, toName: creditor.name, amount: Math.round(pay) })
      creditor.net -= pay
      owed -= pay
    }
  }
  return result
}

interface CreditRow {
  groupId: string; groupName: string
  eventId: string; eventName: string; eventDate: string
  amount: number; fromName: string
}

export default async function TeDebenPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id, groups(name)')
    .eq('user_id', user.id)

  type MembershipRow = { group_id: string; groups: { name: string } | null }
  const groupMap: Record<string, string> = {}
  for (const m of (memberships ?? []) as unknown as MembershipRow[]) {
    groupMap[m.group_id] = m.groups?.name ?? 'Grupo'
  }
  const groupIds = Object.keys(groupMap)

  if (groupIds.length === 0) {
    return <EmptyState icon="✓" title="Sin créditos" sub="No estás en ningún grupo todavía." />
  }

  const { data: eventsRaw } = await supabase
    .from('events')
    .select('id, name, date, group_id')
    .in('group_id', groupIds)
    .neq('status', 'cancelled')
    .order('date', { ascending: false })

  const events = eventsRaw ?? []
  const eventIds = events.map((e) => e.id)

  if (eventIds.length === 0) {
    return <EmptyState icon="✓" title="Sin créditos" sub="No hay juntadas en tus grupos todavía." />
  }

  const [{ data: expensesRaw }, { data: settlementsRaw }] = await Promise.all([
    supabase
      .from('expenses')
      .select('id, event_id, paid_by, amount, expense_splits(user_id, amount)')
      .in('event_id', eventIds),
    supabase
      .from('settlements')
      .select('event_id, from_user, to_user, amount')
      .in('event_id', eventIds),
  ])

  const expenses = (expensesRaw ?? []) as {
    id: string; event_id: string; paid_by: string; amount: number
    expense_splits: { user_id: string; amount: number }[]
  }[]
  const settlements = (settlementsRaw ?? []) as {
    event_id: string; from_user: string; to_user: string; amount: number
  }[]

  const allUserIds = new Set<string>()
  for (const e of expenses) {
    allUserIds.add(e.paid_by)
    for (const s of e.expense_splits) allUserIds.add(s.user_id)
  }

  const { data: profilesRaw } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', [...allUserIds])

  const profileMap: Record<string, string> = {}
  for (const p of profilesRaw ?? []) profileMap[p.id] = p.name ?? 'Usuario'

  const rows: CreditRow[] = []

  for (const event of events) {
    const eventExpenses = expenses.filter((e) => e.event_id === event.id)
    if (eventExpenses.length === 0) continue

    const net: Record<string, number> = {}
    for (const exp of eventExpenses) {
      net[exp.paid_by] = (net[exp.paid_by] ?? 0) + exp.amount
      for (const split of exp.expense_splits) {
        net[split.user_id] = (net[split.user_id] ?? 0) - split.amount
      }
    }
    for (const s of settlements.filter((s) => s.event_id === event.id)) {
      net[s.from_user] = (net[s.from_user] ?? 0) + s.amount
      net[s.to_user]   = (net[s.to_user]   ?? 0) - s.amount
    }

    const balances: Balance[] = Object.entries(net).map(([userId, n]) => ({
      userId, name: profileMap[userId] ?? 'Usuario', net: n,
    }))

    const debts = simplifyDebts(balances)
    for (const debt of debts) {
      if (debt.toId === user.id) {
        rows.push({
          groupId: event.group_id,
          groupName: groupMap[event.group_id] ?? 'Grupo',
          eventId: event.id,
          eventName: event.name,
          eventDate: event.date,
          amount: debt.amount,
          fromName: debt.fromName,
        })
      }
    }
  }

  if (rows.length === 0) {
    return <EmptyState icon="✓" title="Todo saldado" sub="Nadie te debe plata en ningún grupo." />
  }

  const byGroup: Record<string, CreditRow[]> = {}
  for (const r of rows) {
    if (!byGroup[r.groupId]) byGroup[r.groupId] = []
    byGroup[r.groupId].push(r)
  }

  const total = rows.reduce((s, r) => s + r.amount, 0)

  return (
    <div className="p-5 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/home"
          className="inline-block font-body text-sm text-niebla hover:text-humo transition-colors mb-5"
        >
          ← Volver
        </Link>

        <div className="mb-5">
          <h1 className="font-display font-bold text-xl text-humo">Lo que te deben</h1>
          <p className="font-body text-sm text-niebla mt-0.5">
            Total: <span className="font-semibold text-fuego">${total.toLocaleString('es-AR')}</span>
          </p>
        </div>

        <div className="space-y-5">
          {Object.entries(byGroup).map(([groupId, groupRows]) => (
            <div key={groupId}>
              <p className="font-body text-xs font-semibold text-niebla uppercase tracking-wider mb-2 px-1">
                {groupRows[0].groupName}
              </p>
              <div className="rounded-2xl bg-noche-media overflow-hidden divide-y divide-noche">
                {groupRows.map((row, i) => (
                  <Link
                    key={i}
                    href={`/groups/${row.groupId}/events/${row.eventId}?tab=cuentas`}
                    className="flex items-center justify-between px-4 py-3.5 hover:bg-noche/60 transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-body font-medium text-sm text-humo truncate">
                        {row.eventName}
                      </p>
                      <p className="font-body text-xs text-niebla mt-0.5">
                        De {row.fromName} ·{' '}
                        {new Date(row.eventDate).toLocaleDateString('es-AR', {
                          day: 'numeric', month: 'long',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                      <span className="font-body font-semibold text-sm text-fuego">
                        ${row.amount.toLocaleString('es-AR')}
                      </span>
                      <ChevronRight size={14} className="text-niebla group-hover:text-humo transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div className="p-5 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/home"
          className="inline-block font-body text-sm text-niebla hover:text-humo transition-colors mb-5"
        >
          ← Volver
        </Link>
        <div className="text-center py-16">
          <div className="text-3xl mb-3">{icon}</div>
          <p className="font-body font-semibold text-humo">{title}</p>
          <p className="font-body text-sm text-niebla mt-1">{sub}</p>
        </div>
      </div>
    </div>
  )
}
