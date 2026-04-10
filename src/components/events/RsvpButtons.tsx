'use client'

/*
  Botones de RSVP: Voy / Tal vez / No voy.
  Usa una Server Action para el upsert.
*/
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { upsertRsvp } from '@/lib/actions/events'

type RsvpStatus = 'going' | 'maybe' | 'not_going'

interface RsvpButtonsProps {
  eventId: string
  currentStatus: RsvpStatus | null
}

const OPTIONS: { value: RsvpStatus; label: string; emoji: string }[] = [
  { value: 'going',     label: 'Voy',     emoji: '✅' },
  { value: 'maybe',     label: 'Tal vez', emoji: '🤔' },
  { value: 'not_going', label: 'No voy',  emoji: '❌' },
]

export function RsvpButtons({ eventId, currentStatus }: RsvpButtonsProps) {
  const router  = useRouter()
  const [status, setStatus]   = useState<RsvpStatus | null>(currentStatus)
  const [loading, setLoading] = useState(false)

  async function handleRsvp(newStatus: RsvpStatus) {
    if (loading || newStatus === status) return

    setLoading(true)
    const error = await upsertRsvp(eventId, newStatus)

    if (error) {
      console.error(error.error)
      setLoading(false)
      return
    }

    setStatus(newStatus)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-foreground">¿Vas?</p>
      <div className="flex gap-2">
        {OPTIONS.map((opt) => {
          const isActive = status === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => handleRsvp(opt.value)}
              disabled={loading}
              className={`
                flex flex-1 items-center justify-center gap-2
                rounded-xl border px-3 py-3 text-sm font-medium
                transition-all duration-150
                disabled:opacity-60 disabled:cursor-not-allowed
                ${isActive
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border bg-surface-2 text-muted hover:border-accent/40 hover:text-foreground'
                }
              `}
            >
              <span>{opt.emoji}</span>
              <span>{opt.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
