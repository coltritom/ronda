'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { upsertRsvp } from '@/lib/actions/events'

type RsvpStatus = 'going' | 'maybe' | 'not_going'

interface RsvpButtonsProps {
  eventId:       string
  currentStatus: RsvpStatus | null
}

const OPTIONS: { value: RsvpStatus; label: string; emoji: string; activeClass: string }[] = [
  { value: 'going',     label: 'Voy',     emoji: '✅', activeClass: 'border-exito bg-exito/10 text-exito' },
  { value: 'maybe',     label: 'Tal vez', emoji: '🤔', activeClass: 'border-ambar bg-ambar/10 text-ambar' },
  { value: 'not_going', label: 'No voy',  emoji: '❌', activeClass: 'border-error bg-error/10 text-error' },
]

export function RsvpButtons({ eventId, currentStatus }: RsvpButtonsProps) {
  const router  = useRouter()
  const [status, setStatus]   = useState<RsvpStatus | null>(currentStatus)
  const [loading, setLoading] = useState(false)

  async function handleRsvp(newStatus: RsvpStatus) {
    if (loading || newStatus === status) return
    setLoading(true)
    const error = await upsertRsvp(eventId, newStatus)
    if (!error) {
      setStatus(newStatus)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="font-body text-sm font-medium text-humo">¿Vas?</p>
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
                rounded-xl border px-3 py-3 font-body text-sm font-medium
                transition-all duration-150
                disabled:opacity-60 disabled:cursor-not-allowed
                ${isActive
                  ? opt.activeClass
                  : 'bg-noche text-niebla hover:border-fuego/30 hover:text-humo'
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
