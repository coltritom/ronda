'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createExpense, deleteExpense, settleDebt } from '@/lib/actions/expenses'

interface Attendee {
  user_id: string
  name: string
}

interface Settlement {
  from_user: string
  to_user: string
  amount: number
}

interface Split {
  user_id: string
  amount: number
  is_settled: boolean
  profiles: { name: string } | null
}

interface Expense {
  id: string
  description: string | null
  amount: number
  paid_by: string
  split_type: string | null
  profiles: { name: string } | null
  expense_splits: Split[]
}

interface ExpensesSectionProps {
  groupId: string
  eventId: string
  currentUserId: string
  currentUserName: string
  expenses: Expense[]
  attendees: Attendee[]
  settlements: Settlement[]
}

/* ── Balance calculation ────────────────────────────────── */
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

  /* Settlements reducen la deuda del que pagó y el crédito del que recibió */
  for (const s of settlements) {
    ensure(s.from_user, 'Alguien')
    map[s.from_user].net += s.amount
    ensure(s.to_user, 'Alguien')
    map[s.to_user].net -= s.amount
  }

  return Object.entries(map).map(([userId, v]) => ({ userId, name: v.name, net: v.net }))
}

function calcSettlement(balances: { userId: string; name: string; net: number }[]) {
  const eps = 0.005
  const creds = balances.filter((b) => b.net > eps).map((b) => ({ ...b, rem: b.net })).sort((a, b) => b.rem - a.rem)
  const debts = balances.filter((b) => b.net < -eps).map((b) => ({ ...b, rem: -b.net })).sort((a, b) => b.rem - a.rem)

  const txs: { fromUserId: string; fromName: string; toUserId: string; toName: string; amount: number }[] = []
  let ci = 0, di = 0

  while (ci < creds.length && di < debts.length) {
    const transfer = Math.min(creds[ci].rem, debts[di].rem)
    txs.push({
      fromUserId: debts[di].userId,
      fromName: debts[di].name,
      toUserId: creds[ci].userId,
      toName: creds[ci].name,
      amount: Math.round(transfer * 100) / 100,
    })
    creds[ci].rem -= transfer
    debts[di].rem -= transfer
    if (creds[ci].rem < eps) ci++
    if (debts[di].rem < eps) di++
  }

  return txs
}

/* ── Component ──────────────────────────────────────────── */
export function ExpensesSection({
  groupId,
  eventId,
  currentUserId,
  currentUserName,
  expenses,
  attendees,
  settlements,
}: ExpensesSectionProps) {
  const router = useRouter()
  const [showForm, setShowForm]               = useState(false)
  const [description, setDescription]         = useState('')
  const [amount, setAmount]                   = useState('')
  const [paidBy, setPaidBy]                   = useState(currentUserId)
  const [splitType, setSplitType]             = useState<'equal_all' | 'equal_some'>('equal_all')
  const [selectedSplit, setSelectedSplit]     = useState<string[]>([])
  const [loading, setLoading]                 = useState(false)
  const [deleting, setDeleting]               = useState<string | null>(null)
  const [error, setError]                     = useState<string | null>(null)
  const [settleError, setSettleError]         = useState<string | null>(null)
  const [settling, startSettling]             = useTransition()

  /* Always include current user */
  const allAttendees: Attendee[] = attendees.some((a) => a.user_id === currentUserId)
    ? attendees
    : [{ user_id: currentUserId, name: currentUserName }, ...attendees]

  const nameMap = Object.fromEntries(allAttendees.map((a) => [a.user_id, a.name]))
  const displayName = (uid: string, fallback = 'Alguien') =>
    uid === currentUserId ? currentUserName : (nameMap[uid] ?? fallback)

  function toggleSplit(uid: string) {
    setSelectedSplit((prev) =>
      prev.includes(uid) ? prev.filter((u) => u !== uid) : [...prev, uid]
    )
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) return

    const splitIds =
      splitType === 'equal_all'
        ? allAttendees.map((a) => a.user_id)
        : selectedSplit.length > 0
          ? selectedSplit
          : [paidBy]

    setLoading(true)
    setError(null)
    const result = await createExpense(eventId, description.trim() || null, amt, paidBy, splitType, splitIds)
    setLoading(false)

    if (!result) {
      setShowForm(false)
      setDescription('')
      setAmount('')
      setPaidBy(currentUserId)
      setSplitType('equal_all')
      setSelectedSplit([])
      router.refresh()
    } else {
      setError(result.error)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    await deleteExpense(id)
    setDeleting(null)
    router.refresh()
  }

  function handleSettle(toUserId: string, amount: number) {
    setSettleError(null)
    startSettling(async () => {
      const result = await settleDebt(groupId, eventId, toUserId, amount)
      if (result?.error) {
        setSettleError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  const balances = calcBalances(expenses, settlements, displayName)
  const settlement = calcSettlement(balances)

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Gastos</p>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-xs font-medium text-accent hover:text-accent-hover transition-colors"
          >
            + Agregar
          </button>
        )}
      </div>

      {/* ── Formulario ──────────────────────────────────────── */}
      {showForm && (
        <form onSubmit={handleAdd} className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-surface-2 p-4">

          {/* Descripción + Monto */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Descripción (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={80}
              className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">$</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-24 rounded-lg border border-border bg-surface pl-6 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
          </div>

          {/* ¿Quién pagó? */}
          {allAttendees.length > 1 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted">¿Quién pagó?</span>
              <div className="flex flex-wrap gap-2">
                {allAttendees.map((a) => (
                  <button
                    key={a.user_id}
                    type="button"
                    onClick={() => setPaidBy(a.user_id)}
                    className={`
                      flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all
                      ${paidBy === a.user_id
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border text-muted hover:border-accent/40 hover:text-foreground'
                      }
                    `}
                  >
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent/20 text-accent font-bold" style={{ fontSize: 9 }}>
                      {(a.name ?? '?').charAt(0).toUpperCase()}
                    </span>
                    <span>{a.user_id === currentUserId ? 'Yo' : a.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* División */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">Dividir entre</span>
            <div className="flex gap-2">
              {(['equal_all', 'equal_some'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSplitType(type)}
                  className={`
                    flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all
                    ${splitType === type
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border text-muted hover:border-accent/40 hover:text-foreground'
                    }
                  `}
                >
                  {type === 'equal_all' ? 'Todos por igual' : 'Algunos'}
                </button>
              ))}
            </div>
          </div>

          {/* Selector de personas para equal_some */}
          {splitType === 'equal_some' && (
            <div className="flex flex-wrap gap-2">
              {allAttendees.map((a) => (
                <button
                  key={a.user_id}
                  type="button"
                  onClick={() => toggleSplit(a.user_id)}
                  className={`
                    flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all
                    ${selectedSplit.includes(a.user_id)
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border text-muted hover:border-accent/40 hover:text-foreground'
                    }
                  `}
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent/20 text-accent font-bold" style={{ fontSize: 9 }}>
                    {(a.name ?? '?').charAt(0).toUpperCase()}
                  </span>
                  <span>{a.user_id === currentUserId ? 'Yo' : a.name}</span>
                </button>
              ))}
            </div>
          )}

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 rounded-lg border border-border py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !amount}
              className="flex-1 rounded-lg bg-accent py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors disabled:opacity-60"
            >
              {loading ? 'Guardando…' : 'Agregar'}
            </button>
          </div>
        </form>
      )}

      {/* ── Lista de gastos ──────────────────────────────────── */}
      {expenses.length > 0 ? (
        <div className="flex flex-col gap-2">
          {expenses.map((exp) => {
            const payerLabel = exp.paid_by === currentUserId ? 'Yo' : (exp.profiles?.name ?? 'Alguien')
            const splitCount = exp.expense_splits.length
            const perPerson = splitCount > 0 ? exp.amount / splitCount : exp.amount

            return (
              <div
                key={exp.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-2.5"
              >
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-medium text-foreground">{payerLabel}</span>
                    <span className="text-sm text-muted">pagó</span>
                    <span className="text-sm font-semibold text-accent">
                      ${exp.amount.toLocaleString('es-AR')}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    {exp.description && <span className="mr-2">{exp.description}</span>}
                    {splitCount > 0 && (
                      <span>
                        ${perPerson.toLocaleString('es-AR', { maximumFractionDigits: 2 })} c/u entre {splitCount}
                      </span>
                    )}
                  </p>
                </div>
                {exp.paid_by === currentUserId && (
                  <button
                    onClick={() => handleDelete(exp.id)}
                    disabled={deleting === exp.id}
                    className="flex-shrink-0 text-muted hover:text-red-400 transition-colors disabled:opacity-40"
                    title="Eliminar"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    </svg>
                  </button>
                )}
              </div>
            )
          })}

          {/* ── Resumen de deudas ────────────────────────────── */}
          <div className="mt-2 rounded-xl border border-border bg-surface-2 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Resumen</p>
            {settlement.length > 0 ? (
              <div className="flex flex-col gap-2">
                {settlement.map((t, i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">
                        {t.fromUserId === currentUserId ? 'Vos' : t.fromName}
                      </span>
                      {' le debe '}
                      <span className="font-semibold text-accent">
                        ${t.amount.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                      </span>
                      {' a '}
                      <span className="font-medium">
                        {t.toUserId === currentUserId ? 'vos' : t.toName}
                      </span>
                    </p>
                    {t.fromUserId === currentUserId && (
                      <button
                        onClick={() => handleSettle(t.toUserId, t.amount)}
                        disabled={settling}
                        className="flex-shrink-0 rounded-lg border border-green-500/30 px-2.5 py-1 text-xs font-medium text-green-500 hover:bg-green-500/10 transition-colors disabled:opacity-50"
                      >
                        {settling ? '…' : 'Pagué'}
                      </button>
                    )}
                  </div>
                ))}
                {settleError && (
                  <p className="text-xs text-red-400">{settleError}</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted">Todos están al día ✓</p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">Nadie agregó gastos todavía.</p>
      )}
    </section>
  )
}
