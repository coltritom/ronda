export type BalanceEntry = { userId: string; name: string; net: number }

export type DebtTransaction = {
  fromUserId: string
  fromName: string
  toUserId: string
  toName: string
  amount: number
}

interface ExpenseForBalance {
  paid_by: string | null
  paid_by_guest_name?: string | null
  amount: number
  profiles: { name: string } | null
  expense_splits: Array<{
    user_id: string | null
    guest_name?: string | null
    amount: number
    profiles: { name: string } | null
  }>
}

interface SettlementForBalance {
  from_user: string
  to_user: string
  amount: number
}

export function calcBalances(
  expenses: ExpenseForBalance[],
  settlements: SettlementForBalance[],
  nameFor: (uid: string, fallback: string) => string
): BalanceEntry[] {
  const map: Record<string, { name: string; net: number }> = {}

  function entry(key: string, name: string) {
    if (!map[key]) map[key] = { name, net: 0 }
    return map[key]
  }

  for (const exp of expenses) {
    const payerKey  = exp.paid_by ?? `__guest__${exp.paid_by_guest_name ?? 'Invitado'}`
    const payerName = exp.paid_by
      ? nameFor(exp.paid_by, exp.profiles?.name ?? 'Alguien')
      : (exp.paid_by_guest_name ?? 'Invitado')
    const payer = entry(payerKey, payerName)

    for (const s of exp.expense_splits) {
      const partKey  = s.user_id ?? `__guest__${s.guest_name ?? 'Invitado'}`
      const partName = s.user_id
        ? nameFor(s.user_id, s.profiles?.name ?? 'Alguien')
        : (s.guest_name ?? 'Invitado')
      const part = entry(partKey, partName)

      // Credit payer for exactly what each participant owes — this guarantees
      // the ledger sums to zero even if expense.amount ≠ sum(splits).
      payer.net += s.amount
      part.net  -= s.amount
    }
  }

  for (const s of settlements) {
    entry(s.from_user, nameFor(s.from_user, 'Alguien')).net += s.amount
    entry(s.to_user,   nameFor(s.to_user,   'Alguien')).net -= s.amount
  }

  return Object.entries(map).map(([userId, v]) => ({ userId, name: v.name, net: v.net }))
}

export function calcSettlement(balances: BalanceEntry[]): DebtTransaction[] {
  const eps   = 0.005
  const creds = balances.filter((b) => b.net > eps).map((b) => ({ ...b, rem: b.net })).sort((a, b) => b.rem - a.rem)
  const debts = balances.filter((b) => b.net < -eps).map((b) => ({ ...b, rem: -b.net })).sort((a, b) => b.rem - a.rem)

  const txs: DebtTransaction[] = []
  let ci = 0, di = 0

  while (ci < creds.length && di < debts.length) {
    const transfer = Math.min(creds[ci].rem, debts[di].rem)
    txs.push({
      fromUserId: debts[di].userId, fromName: debts[di].name,
      toUserId:   creds[ci].userId, toName:   creds[ci].name,
      amount:     Math.round(transfer * 100) / 100,
    })
    creds[ci].rem -= transfer
    debts[di].rem -= transfer
    if (creds[ci].rem < eps) ci++
    if (debts[di].rem < eps) di++
  }

  return txs
}
