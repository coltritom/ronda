/*
  Tarjeta de juntada para la lista.
  Muestra fecha, título, lugar y cantidad de confirmados.
*/
import Link from 'next/link'
import { MapPin, Users, ChevronRight } from 'lucide-react'
import { formatEventDate } from '@/lib/utils'

interface EventCardProps {
  event: {
    id: string
    name: string
    description: string | null
    date: string
    location: string | null
    status: 'upcoming' | 'completed' | 'cancelled'
    going_count: number
  }
  groupId: string
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  upcoming:  { label: 'Próxima',   className: 'bg-fuego/10 text-fuego' },
  completed: { label: 'Realizada', className: 'bg-exito/10 text-exito' },
  cancelled: { label: 'Cancelada', className: 'bg-error/10 text-error' },
}

export function EventCard({ event, groupId }: EventCardProps) {
  const isPast = new Date(event.date) < new Date()
  const effectiveStatus = isPast && event.status === 'upcoming' ? 'completed' : event.status
  const badge = STATUS_BADGE[effectiveStatus] ?? STATUS_BADGE.upcoming

  return (
    <Link
      href={`/groups/${groupId}/events/${event.id}`}
      className="group flex gap-4 rounded-2xl border border-transparent bg-noche-media p-4 sm:p-5 hover:bg-noche hover:border-fuego/30 transition-all duration-150"
    >
      {/* Bloque de fecha */}
      <div className="flex w-14 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-noche py-2 text-center group-hover:bg-noche-media transition-colors">
        <span className="font-mono text-xl font-bold leading-none text-humo">
          {new Intl.DateTimeFormat('es-AR', {
            day: 'numeric',
            timeZone: 'America/Argentina/Buenos_Aires',
          }).format(new Date(event.date))}
        </span>
        <span className="mt-0.5 font-body text-xs uppercase text-niebla">
          {new Intl.DateTimeFormat('es-AR', {
            month: 'short',
            timeZone: 'America/Argentina/Buenos_Aires',
          }).format(new Date(event.date))}
        </span>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading font-semibold text-humo truncate">
            {event.name}
          </h3>
          <span className={`flex-shrink-0 rounded-full px-2 py-0.5 font-body text-xs font-semibold ${badge.className}`}>
            {badge.label}
          </span>
        </div>

        <p className="mt-0.5 font-body text-xs text-niebla">
          {formatEventDate(event.date)}
        </p>

        {event.location && (
          <p className="mt-1 flex items-center gap-1 font-body text-xs text-niebla">
            <MapPin size={11} />
            {event.location}
          </p>
        )}

        {event.going_count > 0 && (
          <p className="mt-1.5 flex items-center gap-1 font-body text-xs text-niebla">
            <Users size={11} />
            <span className="font-medium text-humo">{event.going_count}</span>
            {' '}{event.going_count === 1 ? 'confirmado' : 'confirmados'}
          </p>
        )}
      </div>

      {/* Flecha */}
      <ChevronRight
        size={16}
        className="mt-1 flex-shrink-0 text-niebla group-hover:text-fuego transition-colors"
      />
    </Link>
  )
}
