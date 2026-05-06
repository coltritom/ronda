export type BalanceEntry = { userId: string; name: string; net: number }

export type DebtTransaction = {
  fromUserId: string
  fromName: string
  toUserId: string
  toName: string
  amount: number
}

interface ExpenseForBalance {
  paid_by: string
  amount: number
  profiles: { name: string } | null
  expense_splits: Array<{
    user_id: string
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

  const ensure = (uid: string, fallback: string) => {
    if (!map[uid]) map[uid] = { name: nameFor(uid, fallback), net: 0 }
  }

  for (const exp of expenses) {
    ensure(exp.paid_by, exp.profiles?.name ?? 'Alguien')
    map[exp.paid_by].net += exp.amount
    for (const s of exp.expense_splits) {
      ensure(s.user_id, s.profiles?.name ?? 'Alguien')
      map[s.user_id].net -= s.amount
    }
  }
  for (const s of settlements) {
    ensure(s.from_user, 'Alguien')
    map[s.from_user].net += s.amount
    ensure(s.to_user, 'Alguien')
    map[s.to_user].net -= s.amount
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
