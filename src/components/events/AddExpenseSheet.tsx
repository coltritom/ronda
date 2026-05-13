'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { ChevronLeft, X, UserPlus } from 'lucide-react'
import { createExpense, updateExpense, type SplitParticipant } from '@/lib/actions/expenses'
import { toast } from 'sonner'

interface Attendee { user_id: string; name: string }

interface Guest { id: string; name: string }

interface Props {
  open: boolean
  onClose: () => void
  onCreated: () => void
  eventId: string
  currentUserId: string
  currentUserName: string
  attendees: Attendee[]
  guests: Guest[]
  // Edit mode
  expenseId?: string
  initialAmount?: number
  initialPaidBy?: string
  initialPaidByGuest?: string
  initialSplitIds?: string[]
  initialGuestSplitNames?: string[]
  initialDescription?: string
}

const COLORS = [
  { bg: 'bg-fuego/20', text: 'text-fuego' },
  { bg: 'bg-uva/20',   text: 'text-uva' },
  { bg: 'bg-menta/20', text: 'text-menta' },
  { bg: 'bg-ambar/20', text: 'text-ambar' },
  { bg: 'bg-rosa/20',  text: 'text-rosa' },
]

export function AddExpenseSheet({
  open, onClose, onCreated, eventId, currentUserId, currentUserName, attendees, guests,
  expenseId, initialAmount, initialPaidBy, initialPaidByGuest, initialSplitIds, initialGuestSplitNames, initialDescription,
}: Props) {
  const allAttendees = useMemo<Attendee[]>(
    () => attendees.some((a) => a.user_id === currentUserId)
      ? attendees
      : [{ user_id: currentUserId, name: currentUserName }, ...attendees],
    [attendees, currentUserId, currentUserName]
  )

  const [amount, setAmount]               = useState('')
  const [paidBy, setPaidBy]               = useState(currentUserId)
  const [paidByGuest, setPaidByGuest]     = useState<string | null>(null)
  const [splitIds, setSplitIds]           = useState<string[]>(allAttendees.map((a) => a.user_id))
  const [guestSplitNames, setGuestSplitNames] = useState<string[]>([])
  const [description, setDescription]     = useState('')
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState<string | null>(null)

  const prevOpenRef = useRef(false)
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setAmount(initialAmount ? String(Math.round(initialAmount)) : '')
      setPaidBy(initialPaidBy ?? currentUserId)
      setPaidByGuest(initialPaidByGuest ?? null)
      setSplitIds(initialSplitIds ?? allAttendees.map((a) => a.user_id))
      setGuestSplitNames(initialGuestSplitNames ?? [])
      setDescription(initialDescription ?? '')
      setError(null)
    }
    prevOpenRef.current = open
  }, [open, currentUserId, allAttendees, initialAmount, initialPaidBy, initialSplitIds, initialGuestSplitNames, initialDescription])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  function selectMemberPayer(uid: string) {
    setPaidBy(uid)
    setPaidByGuest(null)
  }

  function toggleMember(uid: string) {
    setSplitIds((prev) =>
      prev.includes(uid) ? prev.filter((u) => u !== uid) : [...prev, uid]
    )
  }

  const allMembersSelected = splitIds.length === allAttendees.length

  function toggleAll() {
    setSplitIds(allMembersSelected ? [] : allAttendees.map((a) => a.user_id))
  }

  function addGuestToSplit(name: string) {
    setGuestSplitNames((prev) => [...prev, name])
  }

  function removeGuestFromSplit(idx: number) {
    setGuestSplitNames((prev) => prev.filter((_, i) => i !== idx))
  }

  const amtNum           = parseInt(amount, 10) || 0
  const totalParticipants = splitIds.length + guestSplitNames.length
  const perPerson        = totalParticipants > 0 ? amtNum / totalParticipants : 0

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '')
    setAmount(digits)
  }

  const displayAmount  = amount ? parseInt(amount, 10).toLocaleString('es-AR') : ''
  const amountFontSize = displayAmount.length > 9 ? 30 : displayAmount.length > 6 ? 40 : 52
  const signFontSize   = Math.round(amountFontSize * 0.6)

  async function handleSubmit() {
    const amt = parseInt(amount, 10)
    if (!amt || amt <= 0) return

    const participants: SplitParticipant[] = [
      ...splitIds.map((uid) => ({ userId: uid })),
      ...guestSplitNames.map((name) => ({ guestName: name })),
    ]
    if (participants.length === 0) return

    const payerUserId = paidByGuest ? null : paidBy
    const payerGuestName = paidByGuest ?? null
    const splitType = (allMembersSelected && guestSplitNames.length === 0) ? 'equal_all' : 'equal_some'
    setLoading(true)
    setError(null)
    const result = expenseId
      ? await updateExpense(expenseId, description.trim() || null, amt, payerUserId, payerGuestName, splitType, participants)
      : await createExpense(eventId, description.trim() || null, amt, payerUserId, payerGuestName, splitType, participants)
    setLoading(false)
    if (!result) {
      toast.success(expenseId ? 'Gasto actualizado' : 'Gasto agregado')
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
          <h2 className="font-display font-bold text-lg text-humo">{expenseId ? 'Editar gasto' : 'Nuevo gasto'}</h2>
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

          <PayerSelector
            allAttendees={allAttendees}
            guests={guests}
            currentUserId={currentUserId}
            paidBy={paidBy}
            paidByGuest={paidByGuest}
            onSelectMember={selectMemberPayer}
            onSelectGuest={setPaidByGuest}
          />

          <SplitSelector
            allAttendees={allAttendees}
            guests={guests}
            currentUserId={currentUserId}
            splitIds={splitIds}
            onToggle={toggleMember}
            onToggleAll={toggleAll}
            allMembersSelected={allMembersSelected}
            guestSplitNames={guestSplitNames}
            onAddGuest={addGuestToSplit}
            onRemoveGuest={removeGuestFromSplit}
          />

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
            className="w-full rounded-2xl bg-noche px-4 py-3.5 text-sm text-humo placeholder:text-niebla border border-white/[0.08] focus:outline-none focus:border-fuego/40 transition-colors"
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
            disabled={loading || !amount || parseInt(amount, 10) <= 0 || totalParticipants === 0}
            className="w-full rounded-2xl bg-fuego py-4 text-base font-bold text-white transition-colors hover:bg-fuego/90 disabled:opacity-50"
          >
            {loading ? 'Guardando…' : expenseId ? 'Guardar cambios' : 'Agregar gasto'}
          </button>
        </div>

      </div>
    </div>
  )
}

function PayerSelector({ allAttendees, guests, currentUserId, paidBy, paidByGuest, onSelectMember, onSelectGuest }: {
  allAttendees: Attendee[]
  guests: Guest[]
  currentUserId: string
  paidBy: string
  paidByGuest: string | null
  onSelectMember: (uid: string) => void
  onSelectGuest: (name: string | null) => void
}) {
  const [showGuestInput, setShowGuestInput] = useState(false)
  const [guestInput, setGuestInput]         = useState('')

  const registeredGuestNames = new Set(guests.map((g) => g.name))
  const hasCustomPayer = paidByGuest !== null && !registeredGuestNames.has(paidByGuest)

  function commitGuest() {
    const name = guestInput.trim()
    if (!name) return
    onSelectGuest(name)
    setGuestInput('')
    setShowGuestInput(false)
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-semibold text-humo">¿Quién pagó?</span>
      <div className="flex gap-4 overflow-x-auto py-1 -mx-4 px-4">
        {allAttendees.map((a, i) => {
          const c     = COLORS[i % COLORS.length]
          const sel   = !paidByGuest && paidBy === a.user_id
          const label = a.user_id === currentUserId ? 'Yo' : a.name.split(' ')[0]
          return (
            <button
              key={a.user_id}
              type="button"
              onClick={() => onSelectMember(a.user_id)}
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
        {guests.map((g) => {
          const sel = paidByGuest === g.name
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => onSelectGuest(sel ? null : g.name)}
              className="flex flex-col items-center gap-1.5 shrink-0 bg-transparent border-none cursor-pointer p-0"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base transition-all bg-uva/20 text-uva ${sel ? 'ring-2 ring-fuego ring-offset-2 ring-offset-noche-media' : ''}`}>
                {g.name.charAt(0).toUpperCase()}
              </div>
              <span className={`text-xs font-semibold ${sel ? 'text-fuego' : 'text-niebla'}`}>
                {g.name.split(' ')[0]}
              </span>
            </button>
          )
        })}
        {hasCustomPayer ? (
          <button
            type="button"
            onClick={() => onSelectGuest(null)}
            className="flex flex-col items-center gap-1.5 shrink-0 bg-transparent border-none cursor-pointer p-0"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-base bg-uva/20 text-uva ring-2 ring-fuego ring-offset-2 ring-offset-noche-media">
              {paidByGuest!.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-fuego">{paidByGuest!.split(' ')[0]}</span>
          </button>
        ) : (
          !paidByGuest && (
            <button
              type="button"
              onClick={() => setShowGuestInput(true)}
              className="flex flex-col items-center gap-1.5 shrink-0 bg-transparent border-none cursor-pointer p-0"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-base bg-white/5 text-niebla">
                <UserPlus size={16} />
              </div>
              <span className="text-xs font-semibold text-niebla">
                {guests.length > 0 ? 'Otro' : 'Invitado'}
              </span>
            </button>
          )
        )}
      </div>
      {showGuestInput && (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Nombre del invitado"
            value={guestInput}
            onChange={(e) => setGuestInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitGuest()
              if (e.key === 'Escape') { setShowGuestInput(false); setGuestInput('') }
            }}
            autoFocus
            className="flex-1 rounded-xl bg-noche px-3 py-2 text-sm text-humo placeholder:text-niebla border border-white/[0.08] focus:outline-none focus:border-fuego/40"
          />
          <button
            type="button"
            onClick={commitGuest}
            disabled={!guestInput.trim()}
            className="rounded-xl bg-uva/20 text-uva px-3 py-2 text-xs font-semibold disabled:opacity-40"
          >
            Listo
          </button>
          <button
            type="button"
            onClick={() => { setShowGuestInput(false); setGuestInput('') }}
            className="rounded-xl bg-white/5 text-niebla px-3 py-2 text-xs font-semibold"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}

function SplitSelector({ allAttendees, guests, currentUserId, splitIds, onToggle, onToggleAll, allMembersSelected, guestSplitNames, onAddGuest, onRemoveGuest }: {
  allAttendees: Attendee[]
  guests: Guest[]
  currentUserId: string
  splitIds: string[]
  onToggle: (uid: string) => void
  onToggleAll: () => void
  allMembersSelected: boolean
  guestSplitNames: string[]
  onAddGuest: (name: string) => void
  onRemoveGuest: (idx: number) => void
}) {
  const [addingGuest, setAddingGuest] = useState(false)
  const [guestInput, setGuestInput]   = useState('')

  const registeredGuestNames = new Set(guests.map((g) => g.name))
  const manualGuests = guestSplitNames
    .map((name, i) => ({ name, originalIndex: i }))
    .filter(({ name }) => !registeredGuestNames.has(name))

  function commitGuest() {
    const name = guestInput.trim()
    if (!name) return
    onAddGuest(name)
    setGuestInput('')
    setAddingGuest(false)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-humo">¿Entre quiénes se divide?</span>
        <button
          type="button"
          onClick={onToggleAll}
          className="text-xs font-semibold text-fuego bg-transparent border-none cursor-pointer p-0"
        >
          {allMembersSelected ? 'Todos ✓' : 'Todos'}
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
              onClick={() => onToggle(a.user_id)}
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
        {guests.map((g) => {
          const sel = guestSplitNames.includes(g.name)
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => {
                if (sel) onRemoveGuest(guestSplitNames.indexOf(g.name))
                else onAddGuest(g.name)
              }}
              className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-all ${
                sel ? 'bg-uva/20 text-uva' : 'bg-white/5 text-niebla'
              }`}
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                sel ? 'bg-white/20' : 'bg-white/10 text-niebla'
              }`}>
                {g.name.charAt(0).toUpperCase()}
              </span>
              {g.name.split(' ')[0]}
            </button>
          )
        })}
        {manualGuests.map(({ name, originalIndex }) => (
          <button
            key={`manual-${originalIndex}`}
            type="button"
            onClick={() => onRemoveGuest(originalIndex)}
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold bg-uva/20 text-uva"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">
              {name.charAt(0).toUpperCase()}
            </span>
            {name.split(' ')[0]}
            <X size={12} className="ml-0.5 opacity-60" />
          </button>
        ))}
      </div>
      {addingGuest ? (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Nombre del invitado"
            value={guestInput}
            onChange={(e) => setGuestInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitGuest()
              if (e.key === 'Escape') { setAddingGuest(false); setGuestInput('') }
            }}
            autoFocus
            className="flex-1 rounded-xl bg-noche px-3 py-2 text-sm text-humo placeholder:text-niebla border border-white/[0.08] focus:outline-none focus:border-fuego/40"
          />
          <button
            type="button"
            onClick={commitGuest}
            disabled={!guestInput.trim()}
            className="rounded-xl bg-uva/20 text-uva px-3 py-2 text-xs font-semibold disabled:opacity-40"
          >
            Agregar
          </button>
          <button
            type="button"
            onClick={() => { setAddingGuest(false); setGuestInput('') }}
            className="rounded-xl bg-white/5 text-niebla px-3 py-2 text-xs font-semibold"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAddingGuest(true)}
          className="flex items-center gap-1.5 text-xs font-semibold text-niebla bg-transparent border-none cursor-pointer p-0 self-start"
        >
          <UserPlus size={13} />
          {guests.length > 0 ? 'Otro sin cuenta' : 'Sin cuenta'}
        </button>
      )}
      {(splitIds.length + guestSplitNames.length) === 0 && (
        <p className="text-xs text-alerta">Seleccioná al menos una persona para dividir el gasto.</p>
      )}
    </div>
  )
}
