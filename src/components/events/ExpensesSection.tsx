'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { deleteExpense, settleDebt } from '@/lib/actions/expenses'
import { AddExpenseSheet } from './AddExpenseSheet'
import { calcBalances, calcSettlement } from '@/lib/utils/debt'

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
  const [sheetOpen, setSheetOpen]   = useState(false)
  const [deleting, setDeleting]     = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [settleError, setSettleError] = useState<string | null>(null)
  const [settling, startSettling]   = useTransition()

  const allAttendees: Attendee[] = attendees.some((a) => a.user_id === currentUserId)
    ? attendees
    : [{ user_id: currentUserId, name: currentUserName }, ...attendees]

  const nameMap     = Object.fromEntries(allAttendees.map((a) => [a.user_id, a.name]))
  const displayName = (uid: string, fallback = 'Alguien') =>
    uid === currentUserId ? currentUserName : (nameMap[uid] ?? fallback)

  async function handleDelete(id: string) {
    setDeleting(id)
    setDeleteError(null)
    const result = await deleteExpense(id)
    setDeleting(null)
    if (result?.error) {
      setDeleteError(result.error)
    } else {
      router.refresh()
    }
  }

  function handleSettle(toUserId: string, amount: number) {
    setSettleError(null)
    startSettling(async () => {
      const result = await settleDebt(groupId, eventId, toUserId, amount)
      if (result?.error) setSettleError(result.error)
      else router.refresh()
    })
  }

  const balances   = calcBalances(expenses, settlements, displayName)
  const settlement = calcSettlement(balances)

  return (
    <div className="flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-niebla">Gastos</p>
        <button
          onClick={() => setSheetOpen(true)}
          className="text-[13px] font-semibold text-fuego bg-transparent border-none cursor-pointer"
        >
          + Agregar
        </button>
      </div>

      {deleteError && <p className="text-xs text-error">{deleteError}</p>}

      {/* Lista de gastos */}
      {expenses.length > 0 ? (
        <div className="flex flex-col gap-2">
          {expenses.map((exp) => {
            const payerLabel = exp.paid_by === currentUserId ? 'Yo' : (exp.profiles?.name ?? 'Alguien')
            const splitCount = exp.expense_splits.length
            const perPerson  = splitCount > 0 ? exp.amount / splitCount : exp.amount

            return (
              <div
                key={exp.id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-noche-media px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-semibold text-humo">{payerLabel}</span>
                    <span className="text-sm text-niebla">pagó</span>
                    <span className="text-sm font-semibold text-fuego">
                      ${exp.amount.toLocaleString('es-AR')}
                    </span>
                  </div>
                  <p className="text-xs text-niebla mt-0.5">
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
                    className="shrink-0 text-niebla hover:text-error transition-colors disabled:opacity-40"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )
          })}

          {/* Resumen de deudas */}
          <div className="rounded-2xl bg-noche-media p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-niebla">Resumen</p>
            {settlement.length > 0 ? (
              <div className="flex flex-col gap-2">
                {settlement.map((t, i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <p className="text-sm text-humo">
                      <span className="font-semibold">
                        {t.fromUserId === currentUserId ? 'Vos' : t.fromName}
                      </span>
                      {' le debe '}
                      <span className="font-semibold text-fuego">
                        ${t.amount.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                      </span>
                      {' a '}
                      <span className="font-semibold">
                        {t.toUserId === currentUserId ? 'vos' : t.toName}
                      </span>
                    </p>
                    {t.fromUserId === currentUserId && (
                      <button
                        onClick={() => handleSettle(t.toUserId, t.amount)}
                        disabled={settling}
                        className="shrink-0 rounded-full border border-menta/30 px-2.5 py-1 text-xs font-semibold text-menta hover:bg-menta/10 transition-colors disabled:opacity-50"
                      >
                        {settling ? '…' : 'Pagué'}
                      </button>
                    )}
                  </div>
                ))}
                {settleError && (
                  <p className="text-xs text-error">{settleError}</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-niebla">Todos están al día ✓</p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-niebla">Nadie agregó gastos todavía.</p>
      )}

      <AddExpenseSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onCreated={() => router.refresh()}
        eventId={eventId}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        attendees={allAttendees}
      />

    </div>
  )
}
