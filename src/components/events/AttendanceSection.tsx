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
  const [attended, setAttended]    = useState(myAttendance)
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

      <div className="flex items-center justify-between rounded-2xl bg-noche-media px-4 py-3.5">
        <span className="text-sm text-humo">¿Fuiste a esta juntada?</span>
        <div className="flex gap-2">
          <button
            onClick={() => handleToggle(true)}
            disabled={pending}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
              attended
                ? 'bg-menta/[0.15] text-menta ring-1 ring-menta/30'
                : 'bg-white/5 text-niebla'
            }`}
          >
            Fui
          </button>
          <button
            onClick={() => handleToggle(false)}
            disabled={pending}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
              !attended
                ? 'bg-error/[0.12] text-error ring-1 ring-error/20'
                : 'bg-white/5 text-niebla'
            }`}
          >
            No fui
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-error">{error}</p>}

      {(attended || others.length > 0) && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-niebla">
            Fueron ({attendees.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {attended && (
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
          </div>
        </div>
      )}

      {!attended && others.length === 0 && (
        <p className="text-sm text-niebla">Nadie confirmó asistencia todavía.</p>
      )}
    </div>
  )
}
