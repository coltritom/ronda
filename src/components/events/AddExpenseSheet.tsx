'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft } from 'lucide-react'
import { createExpense } from '@/lib/actions/expenses'

interface Attendee { user_id: string; name: string }

interface Props {
  open: boolean
  onClose: () => void
  onCreated: () => void
  eventId: string
  currentUserId: string
  currentUserName: string
  attendees: Attendee[]
}

const COLORS = [
  { bg: 'bg-fuego/20', text: 'text-fuego' },
  { bg: 'bg-uva/20',   text: 'text-uva' },
  { bg: 'bg-menta/20', text: 'text-menta' },
  { bg: 'bg-ambar/20', text: 'text-ambar' },
  { bg: 'bg-rosa/20',  text: 'text-rosa' },
]

export function AddExpenseSheet({ open, onClose, onCreated, eventId, currentUserId, currentUserName, attendees }: Props) {
  const allAttendees: Attendee[] = attendees.some((a) => a.user_id === currentUserId)
    ? attendees
    : [{ user_id: currentUserId, name: currentUserName }, ...attendees]

  const [amount, setAmount]           = useState('') // raw digits only
  const [paidBy, setPaidBy]           = useState(currentUserId)
  const [splitIds, setSplitIds]       = useState<string[]>(allAttendees.map((a) => a.user_id))
  const [description, setDescription] = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setAmount('')
      setPaidBy(currentUserId)
      setSplitIds(allAttendees.map((a) => a.user_id))
      setDescription('')
      setError(null)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  function toggleMember(uid: string) {
    setSplitIds((prev) =>
      prev.includes(uid) ? prev.filter((u) => u !== uid) : [...prev, uid]
    )
  }

  const allSelected = splitIds.length === allAttendees.length

  function toggleAll() {
    setSplitIds(allSelected ? [] : allAttendees.map((a) => a.user_id))
  }

  const amtNum    = parseInt(amount, 10) || 0
  const perPerson = splitIds.length > 0 ? amtNum / splitIds.length : 0

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '')
    setAmount(digits)
  }

  const displayAmount = amount ? parseInt(amount, 10).toLocaleString('es-AR') : ''
  const amountFontSize = displayAmount.length > 9 ? 30 : displayAmount.length > 6 ? 40 : 52
  const signFontSize   = Math.round(amountFontSize * 0.6)

  async function handleSubmit() {
    const amt = parseInt(amount, 10)
    if (!amt || amt <= 0) return
    const ids       = splitIds.length > 0 ? splitIds : [paidBy]
    const splitType = ids.length === allAttendees.length ? 'equal_all' : 'equal_some'
    setLoading(true)
    setError(null)
    const result = await createExpense(eventId, description.trim() || null, amt, paidBy, splitType, ids)
    setLoading(false)
    if (!result) {
      onCreated()
      onClose()
    } else {
      setError(result.error)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-h-[95vh] bg-noche-media rounded-t-[24px] flex flex-col">

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-niebla/30" />
        </div>

        {/* Header */}
        <div className="relative flex items-center justify-center px-4 py-3 shrink-0">
          <button
            onClick={onClose}
            className="absolute left-4 flex items-center gap-1 text-fuego text-[13px] font-semibold bg-transparent border-none cursor-pointer p-0"
          >
            <ChevronLeft size={16} />
            Volver
          </button>
          <h2 className="font-display font-bold text-lg text-humo">Nuevo gasto</h2>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-6">

          {/* Monto */}
          <div className="flex flex-col items-center gap-2 pt-2">
            <span className="text-xs font-semibold text-niebla">¿Cuánto fue?</span>
            <div className="flex items-center justify-center w-full px-2">
              <span
                className="font-bold text-niebla leading-none mr-1 shrink-0 transition-all duration-150"
                style={{ fontSize: `${signFontSize}px` }}
              >$</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={displayAmount}
                onChange={handleAmountChange}
                className="font-bold text-humo bg-transparent border-none outline-none min-w-0 flex-1 text-center placeholder:text-humo/20 transition-all duration-150"
                style={{ fontSize: `${amountFontSize}px` }}
              />
            </div>
          </div>

          {/* ¿Quién pagó? */}
          <div className="flex flex-col gap-3">
            <span className="text-sm font-semibold text-humo">¿Quién pagó?</span>
            <div className="flex gap-4 overflow-x-auto py-1 -mx-4 px-4">
              {allAttendees.map((a, i) => {
                const c     = COLORS[i % COLORS.length]
                const sel   = paidBy === a.user_id
                const label = a.user_id === currentUserId ? 'Yo' : a.name.split(' ')[0]
                return (
                  <button
                    key={a.user_id}
                    type="button"
                    onClick={() => setPaidBy(a.user_id)}
                    className="flex flex-col items-center gap-1.5 shrink-0 bg-transparent border-none cursor-pointer p-0"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base transition-all ${c.bg} ${c.text} ${sel ? 'ring-2 ring-fuego ring-offset-2 ring-offset-noche-media' : ''}`}>
                      {a.name.charAt(0).toUpperCase()}
                    </div>
                    <span className={`text-xs font-semibold ${sel ? 'text-fuego' : 'text-niebla'}`}>
                      {label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ¿Entre quiénes se divide? */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-humo">¿Entre quiénes se divide?</span>
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs font-semibold text-fuego bg-transparent border-none cursor-pointer p-0"
              >
                {allSelected ? 'Todos ✓' : 'Todos'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {allAttendees.map((a, i) => {
                const c     = COLORS[i % COLORS.length]
                const sel   = splitIds.includes(a.user_id)
                const label = a.user_id === currentUserId ? 'Yo' : a.name.split(' ')[0]
                return (
                  <button
                    key={a.user_id}
                    type="button"
                    onClick={() => toggleMember(a.user_id)}
                    className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-all ${
                      sel ? `${c.bg} ${c.text}` : 'bg-white/5 text-niebla'
                    }`}
                  >
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                      sel ? 'bg-white/20' : 'bg-white/10 text-niebla'
                    }`}>
                      {a.name.charAt(0).toUpperCase()}
                    </span>
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Partes iguales */}
          <div className="flex items-center justify-between rounded-2xl bg-noche px-4 py-3.5">
            <span className="text-sm font-semibold text-humo">Partes iguales</span>
            <span className="text-sm font-semibold text-niebla">
              ${perPerson > 0 ? perPerson.toLocaleString('es-AR', { maximumFractionDigits: 2 }) : '0'} c/u
            </span>
          </div>

          {/* Descripción */}
          <input
            type="text"
            placeholder="¿Qué fue? (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={80}
            className="w-full rounded-2xl bg-noche px-4 py-3.5 text-sm text-humo placeholder:text-niebla focus:outline-none"
          />

          {error && <p className="text-xs text-error">{error}</p>}

        </div>

        {/* Footer */}
        <div
          className="px-4 pt-3 border-t border-white/[0.05] shrink-0"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))' }}
        >
          <button
            onClick={handleSubmit}
            disabled={loading || !amount || parseInt(amount, 10) <= 0}
            className="w-full rounded-2xl bg-fuego py-4 text-base font-bold text-white transition-colors hover:bg-fuego/90 disabled:opacity-50"
          >
            {loading ? 'Guardando…' : 'Agregar gasto'}
          </button>
        </div>

      </div>
    </div>
  )
}
