import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EventCard } from '@/components/events/EventCard'
import { CreateEventModal } from '@/components/events/CreateEventModal'
import { AlertCircle, Trophy, ChevronRight, CalendarDays } from 'lucide-react'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

const MEDALS = ['🥇', '🥈', '🥉']

export default async function GroupDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  /* ── Membresía ────────────────────────────────────────────── */
  const { data: membership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', id)
    .eq('user_id', user.id)
    .single()

  const isAdmin = membership?.role === 'admin'

  /* ── Eventos del grupo ────────────────────────────────────── */
  const { data: eventsRaw } = await supabase
    .from('events')
    .select(`
      id, name, description, date, location, status,
      event_rsvps ( response )
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
    going_count: (e.event_rsvps as { response: string }[]).filter((r) => r.response === 'going').length,
  }))

  const upcoming  = events.filter((e) => new Date(e.date) >= now)
  const past      = events.filter((e) => new Date(e.date) < now).reverse()
  const nextEvent = upcoming[0] ?? null

  const eventIds = events.map((e) => e.id)

  /* ── Deudas pendientes del usuario ───────────────────────── */
  let pendingAmount = 0

  if (eventIds.length > 0) {
    const { data: expenseIds } = await supabase
      .from('expenses')
      .select('id')
      .in('event_id', eventIds)

    const ids = (expenseIds ?? []).map((e) => e.id)

    if (ids.length > 0) {
      const { data: splits } = await supabase
        .from('expense_splits')
        .select('amount')
        .eq('user_id', user.id)
        .eq('is_settled', false)
        .neq('expense_id', null)
        .in('expense_id', ids)

      pendingAmount = (splits ?? []).reduce((sum, s) => sum + (s.amount ?? 0), 0)
    }
  }

  /* ── Mini-ranking: top 3 por asistencia ──────────────────── */
  const { data: membersRaw } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', id)

  const memberUserIds = (membersRaw ?? []).map(m => m.user_id)
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', memberUserIds)
  const profileMap = Object.fromEntries((profilesData ?? []).map(p => [p.id, p.name]))

  let miniRanking: { user_id: string; name: string; count: number }[] = []

  if (eventIds.length > 0) {
    const { data: attendance } = await supabase
      .from('event_attendance')
      .select('user_id')
      .in('event_id', eventIds)

    const attendanceMap: Record<string, number> = {}
    for (const r of attendance ?? [])
      attendanceMap[r.user_id] = (attendanceMap[r.user_id] ?? 0) + 1

    miniRanking = (membersRaw ?? [])
      .map((m) => ({
        user_id: m.user_id,
        name:    profileMap[m.user_id] ?? 'Usuario',
        count:   attendanceMap[m.user_id] ?? 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .filter((r) => r.count > 0)
  }

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div className="flex-1 p-5 lg:p-8 max-w-3xl space-y-6">

      {/* Alerta deudas pendientes */}
      {pendingAmount > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-alerta/30 bg-alerta/10 px-4 py-3.5">
          <AlertCircle size={18} className="flex-shrink-0 text-alerta" />
          <div className="min-w-0 flex-1">
            <p className="font-body text-sm font-semibold text-foreground">
              Tenés{' '}
              <span className="text-alerta">
                ${pendingAmount.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
              </span>{' '}
              pendiente de pago
            </p>
            <p className="font-body text-xs text-muted">Revisá los gastos en tus juntadas</p>
          </div>
        </div>
      )}

      {/* Próxima juntada — card destacada */}
      {nextEvent && (
        <section>
          <p className="mb-3 flex items-center gap-1.5 font-body text-xs font-semibold uppercase tracking-wider text-muted">
            <CalendarDays size={12} />
            Próxima juntada
          </p>
          <Link
            href={`/groups/${id}/events/${nextEvent.id}`}
            className="group flex items-center gap-4 rounded-2xl border border-fuego/30 bg-fuego/5 p-4 hover:bg-fuego/10 transition-all duration-150"
          >
            {/* Bloque fecha */}
            <div className="flex w-14 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-fuego/10 py-2 text-center">
              <span className="font-mono text-xl font-bold leading-none text-fuego">
                {new Intl.DateTimeFormat('es-AR', {
                  day: 'numeric',
                  timeZone: 'America/Argentina/Buenos_Aires',
                }).format(new Date(nextEvent.date))}
              </span>
              <span className="mt-0.5 font-body text-xs uppercase text-fuego/70">
                {new Intl.DateTimeFormat('es-AR', {
                  month: 'short',
                  timeZone: 'America/Argentina/Buenos_Aires',
                }).format(new Date(nextEvent.date))}
              </span>
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <h3 className="font-heading font-semibold text-foreground truncate">
                {nextEvent.name}
              </h3>
              {nextEvent.location && (
                <p className="mt-0.5 font-body text-xs text-muted truncate">
                  📍 {nextEvent.location}
                </p>
              )}
              {nextEvent.going_count > 0 && (
                <p className="mt-1 font-body text-xs text-muted">
                  <span className="font-semibold text-foreground">{nextEvent.going_count}</span>
                  {' '}{nextEvent.going_count === 1 ? 'confirmado' : 'confirmados'}
                </p>
              )}
            </div>

            <ChevronRight size={16} className="flex-shrink-0 text-fuego/60 group-hover:text-fuego transition-colors" />
          </Link>
        </section>
      )}

      {/* Mini-ranking */}
      {miniRanking.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <p className="flex items-center gap-1.5 font-body text-xs font-semibold uppercase tracking-wider text-muted">
              <Trophy size={12} />
              Ranking
            </p>
            <Link
              href={`/groups/${id}/rankings`}
              className="font-body text-xs text-fuego hover:underline"
            >
              Ver completo
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            {miniRanking.map((entry, i) => (
              <div
                key={entry.user_id}
                className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 ${
                  entry.user_id === user.id
                    ? 'border-fuego/30 bg-fuego/5'
                    : 'border-border bg-surface'
                }`}
              >
                <span className="w-6 text-center text-base leading-none">
                  {MEDALS[i]}
                </span>
                <span className="flex-1 font-body text-sm text-foreground">
                  {entry.user_id === user.id ? 'Vos' : entry.name}
                </span>
                <span className="font-body text-sm font-semibold text-fuego">
                  {entry.count} {entry.count === 1 ? 'juntada' : 'juntadas'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Lista de juntadas */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-body text-xs font-semibold uppercase tracking-wider text-muted">
            Todas las juntadas
          </p>
          {isAdmin && <CreateEventModal groupId={id} />}
        </div>

        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface py-14 text-center px-6">
            <p className="font-heading text-base font-semibold text-foreground">
              Todavía no hay juntadas
            </p>
            <p className="mt-1.5 max-w-xs font-body text-sm text-muted">
              Coordiná la primera, confirmá asistencias y cerrá cuentas fácil.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {upcoming.length > 0 && (
              <div>
                <p className="mb-3 font-body text-xs font-semibold uppercase tracking-wider text-muted">
                  Próximas
                </p>
                <div className="flex flex-col gap-3">
                  {upcoming.map((event) => (
                    <EventCard key={event.id} event={event} groupId={id} />
                  ))}
                </div>
              </div>
            )}

            {past.length > 0 && (
              <div>
                <p className="mb-3 font-body text-xs font-semibold uppercase tracking-wider text-muted">
                  Pasadas
                </p>
                <div className="flex flex-col gap-3">
                  {past.map((event) => (
                    <EventCard key={event.id} event={event} groupId={id} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

    </div>
  )
}
