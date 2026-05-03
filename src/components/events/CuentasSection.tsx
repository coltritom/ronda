'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { settleDebt } from '@/lib/actions/expenses'
import { CheckCircle2 } from 'lucide-react'

interface Attendee   { user_id: string; name: string }
interface Settlement { from_user: string; to_user: string; amount: number }
interface Split      { user_id: string; amount: number; is_settled: boolean; profiles: { name: string } | null }
interface Expense {
  id: string
  amount: number
  paid_by: string
  profiles: { name: string } | null
  expense_splits: Split[]
}

interface CuentasSectionProps {
  groupId:         string
  eventId:         string
  currentUserId:   string
  currentUserName: string
  expenses:        Expense[]
  attendees:       Attendee[]
  settlements:     Settlement[]
}

function calcBalances(
  expenses: Expense[],
  settlements: Settlement[],
  nameFor: (uid: string, fallback: string) => string
) {
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

function calcSettlement(balances: { userId: string; name: string; net: number }[]) {
  const eps   = 0.005
  const creds = balances.filter((b) => b.net > eps).map((b) => ({ ...b, rem: b.net })).sort((a, b) => b.rem - a.rem)
  const debts = balances.filter((b) => b.net < -eps).map((b) => ({ ...b, rem: -b.net })).sort((a, b) => b.rem - a.rem)

  const txs: { fromUserId: string; fromName: string; toUserId: string; toName: string; amount: number }[] = []
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

export function CuentasSection({
  groupId,
  eventId,
  currentUserId,
  currentUserName,
  expenses,
  attendees,
  settlements,
}: CuentasSectionProps) {
  const router = useRouter()
  const [settleError, setSettleError] = useState<string | null>(null)
  const [settling, startSettling]     = useTransition()

  const allAttendees: Attendee[] = attendees.some((a) => a.user_id === currentUserId)
    ? attendees
    : [{ user_id: currentUserId, name: currentUserName }, ...attendees]

  const nameMap     = Object.fromEntries(allAttendees.map((a) => [a.user_id, a.name]))
  const displayName = (uid: string, fallback = 'Alguien') =>
    uid === currentUserId ? currentUserName : (nameMap[uid] ?? fallback)

  const balances   = calcBalances(expenses, settlements, displayName)
  const settlement = calcSettlement(balances)

  function handleSettle(toUserId: string, amount: number) {
    setSettleError(null)
    startSettling(async () => {
      const result = await settleDebt(groupId, eventId, toUserId, amount)
      if (result?.error) setSettleError(result.error)
      else router.refresh()
    })
  }

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center px-6">
        <p className="font-display font-semibold text-base text-humo">
          Sin gastos registrados
        </p>
        <p className="mt-1.5 text-sm text-niebla">
          Agregá gastos en la pestaña Gastos para ver quién le debe a quién.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-niebla">Balances</p>
        <div className="flex flex-col gap-2">
          {balances
            .sort((a, b) => b.net - a.net)
            .map((b) => {
              const isMe       = b.userId === currentUserId
              const isPositive = b.net > 0.005
              const isNegative = b.net < -0.005

              return (
                <div
                  key={b.userId}
                  className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-2.5 ${
                    isMe ? 'bg-fuego/[0.06] ring-1 ring-fuego/20' : 'bg-noche-media'
                  }`}
                >
                  <span className="text-sm text-humo">{isMe ? 'Vos' : b.name}</span>
                  <span className={`text-sm font-semibold ${
                    isPositive ? 'text-menta' :
                    isNegative ? 'text-error' :
                    'text-niebla'
                  }`}>
                    {isPositive
                      ? `+$${b.net.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`
                      : isNegative
                        ? `-$${Math.abs(b.net).toLocaleString('es-AR', { maximumFractionDigits: 2 })}`
                        : '—'
                    }
                  </span>
                </div>
              )
            })
          }
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-niebla">Pagos sugeridos</p>

        {settlement.length > 0 ? (
          <div className="flex flex-col gap-2">
            {settlement.map((t, i) => {
              const isMyDebt = t.fromUserId === currentUserId

              return (
                <div
                  key={i}
                  className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 ${
                    isMyDebt ? 'bg-alerta/[0.08] ring-1 ring-alerta/20' : 'bg-noche-media'
                  }`}
                >
                  <p className="text-sm text-humo">
                    <span className="font-semibold">
                      {t.fromUserId === currentUserId ? 'Vos' : t.fromName}
                    </span>
                    <span className="text-niebla"> le debe </span>
                    <span className="font-semibold text-fuego">
                      ${t.amount.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-niebla"> a </span>
                    <span className="font-semibold">
                      {t.toUserId === currentUserId ? 'vos' : t.toName}
                    </span>
                  </p>

                  {isMyDebt && (
                    <button
                      onClick={() => handleSettle(t.toUserId, t.amount)}
                      disabled={settling}
                      className="shrink-0 rounded-full border border-menta/30 px-3 py-1.5 text-xs font-semibold text-menta hover:bg-menta/10 transition-colors disabled:opacity-50"
                    >
                      {settling ? '…' : 'Pagué'}
                    </button>
                  )}
                </div>
              )
            })}

            {settleError && (
              <p className="text-xs text-error">{settleError}</p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2.5 rounded-2xl bg-menta/[0.08] ring-1 ring-menta/20 px-4 py-3">
            <CheckCircle2 size={16} className="text-menta" />
            <p className="text-sm text-humo">Todos están al día</p>
          </div>
        )}
      </div>
    </div>
  )
}
