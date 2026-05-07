'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, UserPlus } from 'lucide-react'
import { markAttendance, addEventGuest, removeEventGuest } from '@/lib/actions/events'

interface Attendee { user_id: string; name: string }
interface Guest { id: string; name: string }

interface Props {
  eventId:       string
  currentUserId: string
  myAttendance:  boolean
  attendees:     Attendee[]
  guests:        Guest[]
}

export function AttendanceSection({ eventId, currentUserId, myAttendance, attendees, guests: initialGuests }: Props) {
  const router = useRouter()

  const [attended, setAttended] = useState<boolean | null>(myAttendance ? true : null)
  const [pending, setPending]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const [guests, setGuests]           = useState<Guest[]>(initialGuests)
  const [addingGuest, setAddingGuest] = useState(false)
  const [guestName, setGuestName]     = useState('')
  const [guestPending, setGuestPending] = useState(false)
  const [guestError, setGuestError]   = useState<string | null>(null)
  const [removingId, setRemovingId]   = useState<string | null>(null)

  async function handleToggle(value: boolean) {
    if (pending || value === attended) return
    setError(null)
    const prev = attended
    setAttended(value)
    setPending(true)
    try {
      const result = await markAttendance(eventId, value)
      if (result?.error) {
        setAttended(prev)
        setError(result.error)
      } else {
        router.refresh()
      }
    } catch {
      setAttended(prev)
      setError('No se pudo registrar la asistencia.')
    } finally {
      setPending(false)
    }
  }

  async function handleAddGuest() {
    const name = guestName.trim()
    if (!name || guestPending) return
    setGuestError(null)
    setGuestPending(true)
    try {
      const result = await addEventGuest(eventId, name)
      if ('error' in result) {
        setGuestError(result.error)
      } else {
        setGuests((prev) => [...prev, result.guest])
        setGuestName('')
        setAddingGuest(false)
        router.refresh()
      }
    } catch {
      setGuestError('No se pudo agregar el invitado.')
    } finally {
      setGuestPending(false)
    }
  }

  async function handleRemoveGuest(guestId: string) {
    if (guestPending) return
    setRemovingId(guestId)
    setGuestPending(true)
    try {
      const result = await removeEventGuest(guestId, eventId)
      if (!result?.error) {
        setGuests((prev) => prev.filter((g) => g.id !== guestId))
        router.refresh()
      }
    } finally {
      setRemovingId(null)
      setGuestPending(false)
    }
  }

  const others = attendees.filter((a) => a.user_id !== currentUserId)
  const totalCount = attendees.length + guests.length

  return (
    <div className="flex flex-col gap-4">

      <div className="flex items-center justify-between rounded-2xl bg-noche-media px-4 py-3.5">
        <span className="text-sm text-humo">¿Fuiste a esta juntada?</span>
        <div className="flex gap-2">
          <button
            onClick={() => handleToggle(true)}
            disabled={pending}
            className={`rounded-xl px-4 min-h-[44px] text-sm font-semibold transition-colors disabled:opacity-50 ${
              attended === true
                ? 'bg-menta/[0.15] text-menta ring-1 ring-menta/30'
                : 'bg-white/5 text-niebla'
            }`}
          >
            Fui
          </button>
          <button
            onClick={() => handleToggle(false)}
            disabled={pending}
            className={`rounded-xl px-4 min-h-[44px] text-sm font-semibold transition-colors disabled:opacity-50 ${
              attended === false
                ? 'bg-error/[0.12] text-error ring-1 ring-error/20'
                : 'bg-white/5 text-niebla'
            }`}
          >
            No fui
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-error">{error}</p>}

      {(attended === true || others.length > 0 || guests.length > 0) && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-niebla">
            Fueron ({totalCount})
          </p>
          <div className="flex flex-wrap gap-2">
            {attended === true && (
              <div className="flex items-center gap-2 rounded-full bg-menta/[0.12] px-3 py-1.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-menta/20 text-[10px] font-bold text-menta">
                  Yo
                </div>
                <span className="text-sm text-humo">
                  Yo <span className="text-xs text-niebla">(vos)</span>
                </span>
              </div>
            )}
            {others.map((a) => (
              <div
                key={a.user_id}
                className="flex items-center gap-2 rounded-full bg-noche-media px-3 py-1.5"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-fuego/20 text-[10px] font-bold text-fuego">
                  {a.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-humo">{a.name}</span>
              </div>
            ))}
            {guests.map((g) => (
              <div
                key={g.id}
                className="flex items-center gap-2 rounded-full bg-noche-media px-3 py-1.5"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-uva/20 text-[10px] font-bold text-uva">
                  {g.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-humo">{g.name}</span>
                <span className="text-[10px] text-niebla">inv.</span>
                <button
                  onClick={() => handleRemoveGuest(g.id)}
                  disabled={guestPending && removingId === g.id}
                  className="ml-0.5 text-niebla hover:text-error transition-colors disabled:opacity-40"
                  aria-label="Eliminar invitado"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {attended !== true && others.length === 0 && guests.length === 0 && (
        <p className="text-sm text-niebla">Nadie confirmó asistencia todavía.</p>
      )}

      <div>
        {!addingGuest ? (
          <button
            onClick={() => setAddingGuest(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-fuego bg-transparent border-none cursor-pointer p-0"
          >
            <UserPlus size={13} />
            Agregar invitado sin cuenta
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nombre del invitado"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddGuest()
                  if (e.key === 'Escape') { setAddingGuest(false); setGuestName(''); setGuestError(null) }
                }}
                autoFocus
                className="flex-1 rounded-xl bg-noche-media px-3 py-2 text-sm text-humo placeholder:text-niebla border border-white/[0.08] focus:outline-none focus:border-fuego/40"
              />
              <button
                onClick={handleAddGuest}
                disabled={!guestName.trim() || guestPending}
                className="rounded-xl bg-fuego/[0.15] text-fuego px-3 py-2 text-xs font-semibold disabled:opacity-40 transition-colors"
              >
                Agregar
              </button>
            </div>
            <button
              onClick={() => { setAddingGuest(false); setGuestName(''); setGuestError(null) }}
              className="text-xs text-niebla bg-transparent border-none cursor-pointer text-left p-0"
            >
              Cancelar
            </button>
            {guestError && <p className="text-xs text-error">{guestError}</p>}
          </div>
        )}
      </div>

    </div>
  )
}
