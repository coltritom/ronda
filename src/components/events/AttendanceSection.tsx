'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { markAttendance } from '@/lib/actions/events'

interface Attendee {
  user_id: string
  name: string
}

interface Props {
  eventId: string
  currentUserId: string
  myAttendance: boolean
  attendees: Attendee[]
}

export function AttendanceSection({ eventId, currentUserId, myAttendance, attendees }: Props) {
  const router = useRouter()
  const [attended, setAttended] = useState(myAttendance)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleToggle(value: boolean) {
    if (pending || value === attended) return
    setError(null)
    const prev = attended
    setAttended(value)
    startTransition(async () => {
      const result = await markAttendance(eventId, value)
      if (result?.error) {
        setAttended(prev)
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  /* Quiénes fueron (excluye al usuario actual — se muestra aparte) */
  const others = attendees.filter((a) => a.user_id !== currentUserId)

  return (
    <section>
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <span>✅</span>
        <span>Asistencia real</span>
      </p>

      {/* Toggle del usuario actual */}
      <div className="mb-4 flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
        <span className="text-sm text-foreground">¿Fuiste a esta juntada?</span>
        <div className="flex gap-2">
          <button
            onClick={() => handleToggle(true)}
            disabled={pending}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
              attended
                ? 'bg-green-500/20 text-green-500 ring-1 ring-green-500/40'
                : 'border border-border text-muted hover:text-foreground'
            }`}
          >
            Fui
          </button>
          <button
            onClick={() => handleToggle(false)}
            disabled={pending}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
              !attended
                ? 'bg-red-500/20 text-red-500 ring-1 ring-red-500/40'
                : 'border border-border text-muted hover:text-foreground'
            }`}
          >
            No fui
          </button>
        </div>
      </div>

      {error && <p className="mb-3 text-xs text-red-500">{error}</p>}

      {/* Lista de asistentes confirmados */}
      {attendees.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {attended && (
            <div className="flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/20 text-xs font-semibold text-green-500">
                Yo
              </div>
              <span className="text-sm text-foreground">
                Yo <span className="text-xs text-muted">(vos)</span>
              </span>
            </div>
          )}
          {others.map((a) => (
            <div
              key={a.user_id}
              className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-xs font-semibold text-accent">
                {a.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-foreground">{a.name}</span>
            </div>
          ))}
        </div>
      ) : (
        !attended && (
          <p className="text-sm text-muted">Nadie confirmó asistencia todavía.</p>
        )
      )}
    </section>
  )
}
