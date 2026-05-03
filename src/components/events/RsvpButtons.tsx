'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Minus } from 'lucide-react'
import { upsertRsvp } from '@/lib/actions/events'

type RsvpStatus = 'going' | 'maybe' | 'not_going'

interface RsvpButtonsProps {
  eventId:       string
  currentStatus: RsvpStatus | null
}

const CHIPS: {
  id: RsvpStatus
  label: string
  icon: typeof Check
  activeClasses: string
  iconColor: string
  bgConfirmed: string
  confirmLabel: string
}[] = [
  {
    id: 'going', label: 'Voy', icon: Check,
    activeClasses: 'bg-menta/[0.15] ring-1 ring-menta/40',
    iconColor: 'text-menta', bgConfirmed: 'bg-menta/20',
    confirmLabel: 'Confirmaste que vas',
  },
  {
    id: 'not_going', label: 'No voy', icon: X,
    activeClasses: 'bg-error/[0.12] ring-1 ring-error/30',
    iconColor: 'text-error', bgConfirmed: 'bg-error/15',
    confirmLabel: 'No vas a ir',
  },
  {
    id: 'maybe', label: 'No sé', icon: Minus,
    activeClasses: 'bg-niebla/[0.15] ring-1 ring-niebla/40',
    iconColor: 'text-niebla', bgConfirmed: 'bg-niebla/15',
    confirmLabel: 'Todavía no sabés',
  },
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

  const currentChip = CHIPS.find((c) => c.id === status)

  if (status && currentChip) {
    const Icon = currentChip.icon
    return (
      <div className="bg-noche-media rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentChip.bgConfirmed}`}>
            <Icon size={16} className={currentChip.iconColor} strokeWidth={2.5} />
          </div>
          <span className="text-sm font-medium text-humo">{currentChip.confirmLabel}</span>
        </div>
        <button
          onClick={() => setStatus(null)}
          disabled={loading}
          className="text-xs text-fuego font-semibold bg-transparent border-none cursor-pointer disabled:opacity-50"
        >
          Cambiar
        </button>
      </div>
    )
  }

  return (
    <div className="bg-noche-media rounded-2xl p-4">
      <p className="text-xs text-niebla mb-3">¿Vas a esta juntada?</p>
      <div className="flex gap-2">
        {CHIPS.map((chip) => {
          const Icon = chip.icon
          return (
            <button
              key={chip.id}
              onClick={() => handleRsvp(chip.id)}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-sm font-semibold border-none cursor-pointer transition-all bg-white/5 text-niebla hover:bg-white/10 active:scale-[0.97] disabled:opacity-50"
            >
              <Icon size={15} strokeWidth={2.5} />
              {chip.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
