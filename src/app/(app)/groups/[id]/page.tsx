import { createClient } from '@/lib/supabase/server'
import { EventCard } from '@/components/events/EventCard'
import { CreateEventModal } from '@/components/events/CreateEventModal'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function GroupDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  /* isAdmin — para mostrar el botón de crear juntada */
  const { data: membership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', id)
    .eq('user_id', user!.id)
    .single()

  const isAdmin = membership?.role === 'admin'

  /* ── Fetchear juntadas del grupo ─────────────────────────── */
  const { data: eventsRaw } = await supabase
    .from('events')
    .select(`
      id, name, description, date, location, status,
      event_rsvps ( count )
    `)
    .eq('group_id', id)
    .neq('status', 'cancelled')
    .order('date', { ascending: true })

  const now = new Date()
  const events = (eventsRaw ?? []).map((e) => ({
    id:          e.id,
    name:        e.name,
    description: e.description,
    date:        e.date,
    location:    e.location,
    status:      e.status as 'upcoming' | 'completed' | 'cancelled',
    going_count: (e.event_rsvps[0] as { count: number })?.count ?? 0,
  }))

  const upcoming = events.filter((e) => new Date(e.date) >= now)
  const past     = events.filter((e) => new Date(e.date) < now)

  return (
    <div className="flex-1 p-6 lg:p-8 max-w-3xl">

      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          Juntadas
        </h2>
        {isAdmin && <CreateEventModal groupId={id} />}
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface py-16 text-center px-6">
          <div className="mb-3 text-4xl">📅</div>
          <h3 className="font-heading text-base font-semibold text-foreground">
            Todavía no hay juntadas
          </h3>
          <p className="mt-1.5 max-w-xs text-sm text-muted">
            Coordiná la primera, confirmá asistencias y cerrá cuentas fácil.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {upcoming.length > 0 && (
            <section>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
                Próximas
              </p>
              <div className="flex flex-col gap-3">
                {upcoming.map((event) => (
                  <EventCard key={event.id} event={event} groupId={id} />
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
                Pasadas
              </p>
              <div className="flex flex-col gap-3">
                {past.map((event) => (
                  <EventCard key={event.id} event={event} groupId={id} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
