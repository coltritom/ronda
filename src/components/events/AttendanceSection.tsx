'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { markAttendance } from '@/lib/actions/events'

interface Attendee { user_id: string; name: string }

interface Props {
  eventId:       string
  currentUserId: string
  myAttendance:  boolean
  attendees:     Attendee[]
}

export function AttendanceSection({ eventId, currentUserId, myAttendance, attendees }: Props) {
  const router = useRouter()
  const [attended, setAttended]   = useState(myAttendance)
  const [pending, startTransition] = useTransition()
  const [error, setError]          = useState<string | null>(null)

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

  const others = attendees.filter((a) => a.user_id !== currentUserId)

  return (
    <div className="flex flex-col gap-4">

      {/* Toggle del usuario */}
      <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3.5">
        <span className="font-body text-sm text-foreground">¿Fuiste a esta juntada?</span>
        <div className="flex gap-2">
          <button
            onClick={() => handleToggle(true)}
            disabled={pending}
            className={`rounded-xl px-3.5 py-1.5 font-body text-xs font-semibold transition-colors disabled:opacity-50 ${
              attended
                ? 'bg-exito/15 text-exito ring-1 ring-exito/30'
                : 'border border-border text-muted hover:text-foreground'
            }`}
          >
            Fui
          </button>
          <button
            onClick={() => handleToggle(false)}
            disabled={pending}
            className={`rounded-xl px-3.5 py-1.5 font-body text-xs font-semibold transition-colors disabled:opacity-50 ${
              !attended
                ? 'bg-error/10 text-error ring-1 ring-error/20'
                : 'border border-border text-muted hover:text-foreground'
            }`}
          >
            No fui
          </button>
        </div>
      </div>

      {error && <p className="font-body text-xs text-error">{error}</p>}

      {/* Lista de asistentes */}
      {(attended || others.length > 0) && (
        <div>
          <p className="mb-2 font-body text-xs font-semibold uppercase tracking-wider text-muted">
            Fueron ({attendees.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {attended && (
              <div className="flex items-center gap-2 rounded-full border border-exito/30 bg-exito/10 px-3 py-1.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-exito/20 font-body text-[10px] font-bold text-exito">
                  Yo
                </div>
                <span className="font-body text-sm text-foreground">
                  Yo <span className="text-xs text-muted">(vos)</span>
                </span>
              </div>
            )}
            {others.map((a) => (
              <div
                key={a.user_id}
                className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-fuego/20 font-body text-[10px] font-bold text-fuego">
                  {a.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-body text-sm text-foreground">{a.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!attended && others.length === 0 && (
        <p className="font-body text-sm text-muted">Nadie confirmó asistencia todavía.</p>
      )}
    </div>
  )
}
