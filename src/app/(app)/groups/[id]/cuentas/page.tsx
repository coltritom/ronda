import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CuentasGlobalesClient } from '@/components/cuentas/CuentasGlobalesClient'
import type { UIMember, UIDebt } from '@/types'

function simplifyDebts(
  splits: Array<{ user_id: string; amount: number; paid_by: string }>
): UIDebt[] {
  const balance: Record<string, number> = {}
  for (const s of splits) {
    balance[s.paid_by] = (balance[s.paid_by] ?? 0) + s.amount
    balance[s.user_id] = (balance[s.user_id] ?? 0) - s.amount
  }

  const creditors: { id: string; amount: number }[] = []
  const debtors:   { id: string; amount: number }[] = []
  for (const [id, bal] of Object.entries(balance)) {
    if (bal > 0.01)  creditors.push({ id, amount: bal })
    else if (bal < -0.01) debtors.push({ id, amount: -bal })
  }
  creditors.sort((a, b) => b.amount - a.amount)
  debtors.sort((a, b) => b.amount - a.amount)

  const result: UIDebt[] = []
  let ci = 0, di = 0
  while (ci < creditors.length && di < debtors.length) {
    const credit = creditors[ci]
    const debt   = debtors[di]
    const amount = Math.min(credit.amount, debt.amount)
    result.push({ fromId: debt.id, toId: credit.id, amount: Math.round(amount * 100) / 100, paid: false })
    credit.amount -= amount
    debt.amount   -= amount
    if (credit.amount < 0.01) ci++
    if (debt.amount   < 0.01) di++
  }
  return result
}

export default async function CuentasGlobalesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Round 1 — all depend only on groupId
  const [{ data: groupData }, { data: membersRaw }, { data: eventsRaw }] = await Promise.all([
    supabase.from('groups').select('id, name').eq('id', id).single(),
    supabase.from('group_members').select('user_id').eq('group_id', id),
    supabase.from('events').select('id').eq('group_id', id).neq('status', 'cancelled'),
  ])

  if (!groupData) redirect('/groups')
  const memberUserIds = (membersRaw ?? []).map((m) => m.user_id)
  if (!memberUserIds.includes(user.id)) redirect('/groups')

  const eventIds = (eventsRaw ?? []).map((e) => e.id)

  // Round 2 — profiles and expenses in parallel
  const [{ data: profilesData }, { data: expensesRaw }] = await Promise.all([
    supabase.from('profiles').select('id, name').in('id', memberUserIds),
    eventIds.length > 0
      ? supabase.from('expenses').select('id, paid_by').in('event_id', eventIds)
      : Promise.resolve({ data: [] as { id: string; paid_by: string }[] }),
  ])

  const profileMap = Object.fromEntries((profilesData ?? []).map((p) => [p.id, p.name]))
  const members: UIMember[] = (membersRaw ?? []).map((m, i) => ({
    id:         m.user_id,
    name:       profileMap[m.user_id] ?? 'Usuario',
    colorIndex: i,
  }))

  const allExpenseIds: string[] = (expensesRaw ?? []).map((e) => e.id)
  const expensesByPayer: Record<string, string[]> = {}
  const expenseMap: Record<string, string> = {}
  for (const e of expensesRaw ?? []) {
    expenseMap[e.id] = e.paid_by
    if (!expensesByPayer[e.paid_by]) expensesByPayer[e.paid_by] = []
    expensesByPayer[e.paid_by].push(e.id)
  }

  // Round 3 — expense_splits (depends on expense IDs from round 2)
  let initialDeudas: UIDebt[] = []
  if (allExpenseIds.length > 0) {
    const { data: splitsRaw } = await supabase
      .from('expense_splits')
      .select('expense_id, user_id, amount')
      .in('expense_id', allExpenseIds)
      .eq('is_settled', false)

    initialDeudas = simplifyDebts(
      (splitsRaw ?? []).flatMap((s) => {
        const paidBy = expenseMap[s.expense_id]
        if (!paidBy || s.user_id === paidBy) return []
        return [{ user_id: s.user_id, amount: s.amount ?? 0, paid_by: paidBy }]
      })
    )
  }

  return (
    <CuentasGlobalesClient
      groupId={id}
      groupName={groupData.name}
      members={members}
      initialDeudas={initialDeudas}
      expensesByPayer={expensesByPayer}
      currentUserId={user.id}
    />
  )
}
