/*
  Tarjeta de juntada para la lista.
  Muestra fecha, título, lugar y cantidad de confirmados.
*/
import Link from 'next/link'
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

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  upcoming:  { label: 'Próxima',    className: 'bg-accent/10 text-accent' },
  completed: { label: 'Realizada',  className: 'bg-green-500/10 text-green-400' },
  cancelled: { label: 'Cancelada',  className: 'bg-red-500/10 text-red-400' },
}

export function EventCard({ event, groupId }: EventCardProps) {
  const isPast = new Date(event.date) < new Date()
  const effectiveStatus = isPast && event.status === 'upcoming' ? 'completed' : event.status
  const status = STATUS_LABEL[effectiveStatus] ?? STATUS_LABEL.upcoming

  return (
    <Link
      href={`/groups/${groupId}/events/${event.id}`}
      className="
        group flex gap-4
        rounded-2xl border border-border bg-surface
        p-4 sm:p-5
        hover:bg-surface-2 hover:border-accent/30
        transition-all duration-150
      "
    >
      {/* Bloque de fecha */}
      <div className="
        flex w-14 flex-shrink-0 flex-col items-center justify-center
        rounded-xl bg-surface-2 py-2 text-center
        group-hover:bg-background transition-colors
      ">
        <span className="font-mono text-xl font-bold leading-none text-foreground">
          {new Intl.DateTimeFormat('es-AR', { day: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date(event.date))}
        </span>
        <span className="mt-0.5 text-xs uppercase text-muted">
          {new Intl.DateTimeFormat('es-AR', { month: 'short', timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date(event.date))}
        </span>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading font-semibold text-foreground truncate">
            {event.name}
          </h3>
          <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
            {status.label}
          </span>
        </div>

        <p className="mt-0.5 text-xs text-muted">
          {formatEventDate(event.date)}
        </p>

        {event.location && (
          <p className="mt-1 flex items-center gap-1 text-xs text-muted">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            {event.location}
          </p>
        )}

        {event.going_count > 0 && (
          <p className="mt-1.5 text-xs text-muted">
            <span className="font-medium text-foreground">{event.going_count}</span>
            {' '}{event.going_count === 1 ? 'confirmado' : 'confirmados'}
          </p>
        )}
      </div>

      {/* Flecha */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16" height="16"
        viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
        className="mt-1 flex-shrink-0 text-muted group-hover:text-accent transition-colors"
      >
        <path d="M9 18l6-6-6-6"/>
      </svg>
    </Link>
  )
}
