import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

interface NetBalance {
  userId: string
  name: string
  net: number
}

interface EventDebt {
  from: string
  to: string
  amount: number
}

interface EventSection {
  eventId: string
  eventName: string
  eventDate: string
  debts: EventDebt[]
}

function simplifyDebts(balances: NetBalance[]): EventDebt[] {
  const creditors = balances.filter((b) => b.net > 0.005).map((b) => ({ ...b }))
  const debtors   = balances.filter((b) => b.net < -0.005).map((b) => ({ ...b }))
  const result: EventDebt[] = []

  for (const debtor of debtors) {
    let owed = Math.abs(debtor.net)
    for (const creditor of creditors) {
      if (owed < 0.005 || creditor.net < 0.005) continue
      const pay = Math.min(owed, creditor.net)
      result.push({ from: debtor.name, to: creditor.name, amount: Math.round(pay) })
      creditor.net -= pay
      owed -= pay
    }
  }

  return result
}

export default async function GroupCuentasPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  /* ── Eventos del grupo ─────────────────────────────────── */
  const { data: eventsRaw } = await supabase
    .from('events')
    .select('id, name, date')
    .eq('group_id', id)
    .neq('status', 'cancelled')
    .order('date', { ascending: false })

  const events = eventsRaw ?? []
  if (events.length === 0) {
    return (
      <div className="p-5 lg:p-8 text-center text-muted font-body text-sm">
        No hay juntadas en este grupo todavía.
      </div>
    )
  }

  const eventIds = events.map((e) => e.id)

  /* ── Gastos + splits ───────────────────────────────────── */
  const { data: expensesRaw } = await supabase
    .from('expenses')
    .select('id, event_id, paid_by, amount, expense_splits ( user_id, amount )')
    .in('event_id', eventIds)

  const expenses = (expensesRaw ?? []) as {
    id: string
    event_id: string
    paid_by: string
    amount: number
    expense_splits: { user_id: string; amount: number }[]
  }[]

  /* ── Settlements ───────────────────────────────────────── */
  const { data: settlementsRaw } = await supabase
    .from('settlements')
    .select('event_id, from_user, to_user, amount')
    .in('event_id', eventIds)

  const settlements = (settlementsRaw ?? []) as {
    event_id: string; from_user: string; to_user: string; amount: number
  }[]

  /* ── Perfiles de miembros ──────────────────────────────── */
  const { data: membersRaw } = await supabase
    .from('group_members')
    .select('user_id, profiles ( name )')
    .eq('group_id', id)

  const profileMap: Record<string, string> = {}
  for (const m of membersRaw ?? []) {
    profileMap[(m as any).user_id] = (m as any).profiles?.name ?? 'Sin nombre'
  }

  /* ── Calcular balances por evento ──────────────────────── */
  const sections: EventSection[] = []

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

    const balances: NetBalance[] = Object.entries(net).map(([userId, n]) => ({
      userId,
      name: profileMap[userId] ?? 'Usuario',
      net: n,
    }))

    const debts = simplifyDebts(balances)
    if (debts.length > 0) {
      sections.push({ eventId: event.id, eventName: event.name, eventDate: event.date, debts })
    }
  }

  if (sections.length === 0) {
    return (
      <div className="p-5 lg:p-8">
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="text-3xl mb-3">✓</div>
          <p className="font-body font-semibold text-foreground">Todo saldado</p>
          <p className="font-body text-sm text-muted mt-1">No hay cuentas pendientes en este grupo.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-5 lg:p-8">
      <div className="max-w-2xl mx-auto space-y-5">
        {sections.map((section) => (
          <div key={section.eventId} className="rounded-2xl border border-border bg-surface overflow-hidden">

            {/* Header de la juntada */}
            <Link
              href={`/groups/${id}/events/${section.eventId}?tab=cuentas`}
              className="flex items-center justify-between px-4 py-3 bg-surface hover:bg-surface/80 transition-colors group"
            >
              <div>
                <p className="font-body font-semibold text-sm text-foreground">{section.eventName}</p>
                <p className="font-body text-xs text-muted mt-0.5">
                  {new Date(section.eventDate).toLocaleDateString('es-AR', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </p>
              </div>
              <ChevronRight size={16} className="text-muted group-hover:text-foreground transition-colors" />
            </Link>

            {/* Deudas */}
            <div className="divide-y divide-border">
              {section.debts.map((debt, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2 font-body text-sm">
                    <span className="font-medium text-foreground">{debt.from}</span>
                    <span className="text-muted">→</span>
                    <span className="text-muted">{debt.to}</span>
                  </div>
                  <span className="font-body font-semibold text-sm text-alerta">
                    ${debt.amount.toLocaleString('es-AR')}
                  </span>
                </div>
              ))}
            </div>

          </div>
        ))}
      </div>
    </div>
  )
}
