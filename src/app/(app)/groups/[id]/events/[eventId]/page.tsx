/*
  Página de detalle de una juntada.

  Muestra:
  - Info completa del evento (título, fecha, lugar, descripción)
  - Botones de RSVP (Voy / Tal vez / No voy)
  - Lista de confirmados, tal vez y no van
*/
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatEventDate } from '@/lib/utils'
import { RsvpButtons } from '@/components/events/RsvpButtons'
import { ContributionsSection } from '@/components/events/ContributionsSection'
import { ExpensesSection } from '@/components/events/ExpensesSection'
import { AttendanceSection } from '@/components/events/AttendanceSection'

interface PageProps {
  params: Promise<{ id: string; eventId: string }>
}

type RsvpStatus = 'going' | 'maybe' | 'not_going'

const RSVP_SECTIONS: { status: RsvpStatus; label: string; emoji: string }[] = [
  { status: 'going',     label: 'Van',      emoji: '✅' },
  { status: 'maybe',     label: 'Tal vez',  emoji: '🤔' },
  { status: 'not_going', label: 'No van',   emoji: '❌' },
]

export default async function EventDetailPage({ params }: PageProps) {
  const { id: groupId, eventId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  /* ── Verificar membresía al grupo ────────────────────────── */
  const { data: membership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user!.id)
    .single()

  if (!membership) notFound()

  /* ── Fetchear el evento ───────────────────────────────────── */
  const { data: event } = await supabase
    .from('events')
    .select('id, name, description, date, location, status')
    .eq('id', eventId)
    .eq('group_id', groupId)
    .single()

  if (!event) notFound()

  const isPast = new Date(event.date) < new Date()

  /* ── Fetchear todos los RSVPs del evento con perfil ─────── */
  const { data: rsvpsRaw } = await supabase
    .from('event_rsvps')
    .select(`
      response, user_id,
      profiles ( name )
    `)
    .eq('event_id', eventId)

  const rsvps = (rsvpsRaw ?? []) as unknown as {
    response: RsvpStatus
    user_id: string
    profiles: { name: string } | null
  }[]

  /* RSVP del usuario actual */
  const myRsvp = rsvps.find((r) => r.user_id === user!.id)?.response ?? null

  /* Agrupar por status */
  const byStatus = (status: RsvpStatus) =>
    rsvps.filter((r) => r.response === status)

  /* Confirmados para el selector de aportes */
  const goingAttendees = rsvps
    .filter((r) => r.response === 'going')
    .map((r) => ({ user_id: r.user_id, name: r.profiles?.name ?? 'Usuario' }))

  const statusLabel: Record<string, { label: string; className: string }> = {
    upcoming:  { label: 'Próxima',   className: 'bg-accent/10 text-accent' },
    completed: { label: 'Realizada', className: 'bg-green-500/10 text-green-400' },
    cancelled: { label: 'Cancelada', className: 'bg-red-500/10 text-red-400' },
  }
  const eventStatus = isPast && event.status === 'upcoming'
    ? statusLabel.completed
    : (statusLabel[event.status] ?? statusLabel.upcoming)

  /* ── Asistencia real (solo si el evento ya pasó) ─────────── */
  let attendanceList: { user_id: string; name: string }[] = []
  let myAttendance = false

  if (isPast) {
    const { data: attendanceRaw } = await supabase
      .from('event_attendance')
      .select('user_id, profiles ( name )')
      .eq('event_id', eventId)

    attendanceList = (attendanceRaw ?? []).map((a) => ({
      user_id: a.user_id as string,
      name: (a.profiles as unknown as { name: string } | null)?.name ?? 'Usuario',
    }))
    myAttendance = attendanceList.some((a) => a.user_id === user!.id)
  }

  /* ── Fetchear aportes del evento con perfil ──────────────── */
  const { data: contributionsRaw, error: contribError } = await supabase
    .from('contributions')
    .select(`
      id, category, description, quantity, user_id,
      profiles ( name )
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })

  if (contribError) console.error('Error fetching contributions:', contribError.message)

  /* ── Fetchear gastos del evento con splits y perfil ──────── */
  const { data: expensesRaw, error: expensesError } = await supabase
    .from('expenses')
    .select(`
      id, description, amount, paid_by, split_type,
      profiles ( name ),
      expense_splits ( user_id, amount, is_settled, profiles ( name ) )
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })

  if (expensesError) console.error('Error fetching expenses:', expensesError.message)

  /* ── Fetchear pagos saldados ──────────────────────────────── */
  const { data: settlementsRaw } = await supabase
    .from('settlements')
    .select('from_user, to_user, amount')
    .eq('event_id', eventId)

  const settlements = (settlementsRaw ?? []) as {
    from_user: string
    to_user: string
    amount: number
  }[]

  const expenses = (expensesRaw ?? []) as unknown as {
    id: string
    description: string | null
    amount: number
    paid_by: string
    split_type: string | null
    profiles: { name: string } | null
    expense_splits: {
      user_id: string
      amount: number
      is_settled: boolean
      profiles: { name: string } | null
    }[]
  }[]

  const currentUserName = rsvps.find((r) => r.user_id === user!.id)?.profiles?.name ?? 'Yo'

  const contributions = (contributionsRaw ?? []) as unknown as {
    id: string
    category: 'bebida' | 'comida' | 'postre' | 'hielo' | 'snacks' | 'juegos' | 'utensilios' | 'otros'
    description: string | null
    quantity: number
    user_id: string
    profiles: { name: string } | null
  }[]

  return (
    <div className="flex flex-col min-h-full">

      {/* ── Encabezado con breadcrumb ─────────────────────────── */}
      <div className="border-b border-border bg-surface px-6 py-5 lg:px-8">
        <div className="max-w-2xl">
          {/* Breadcrumb */}
          <nav className="mb-3 flex items-center gap-1.5 text-xs text-muted">
            <Link href={`/groups/${groupId}`} className="hover:text-foreground transition-colors">
              Grupo
            </Link>
            <span>/</span>
            <span className="text-foreground">Juntada</span>
          </nav>

          {/* Título + badge */}
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-heading text-2xl font-bold text-foreground">
              {event.name}
            </h1>
            <span className={`mt-1 flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${eventStatus.className}`}>
              {eventStatus.label}
            </span>
          </div>

          {/* Meta info */}
          <div className="mt-3 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-sm text-muted">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                <line x1="16" x2="16" y1="2" y2="6"/>
                <line x1="8" x2="8" y1="2" y2="6"/>
                <line x1="3" x2="21" y1="10" y2="10"/>
              </svg>
              <span className="capitalize">{formatEventDate(event.date)}</span>
            </div>

            {event.location && (
              <div className="flex items-center gap-2 text-sm text-muted">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <span>{event.location}</span>
              </div>
            )}
          </div>

          {event.description && (
            <p className="mt-3 text-sm text-muted leading-relaxed">
              {event.description}
            </p>
          )}
        </div>
      </div>

      {/* ── Contenido ────────────────────────────────────────── */}
      <div className="flex-1 p-6 lg:p-8">
        <div className="max-w-2xl flex flex-col gap-8">

          {/* RSVP — solo para juntadas próximas */}
          {event.status === 'upcoming' && (
            <RsvpButtons eventId={eventId} currentStatus={myRsvp} />
          )}

          {/* Asistencia real — solo para juntadas pasadas */}
          {isPast && (
            <AttendanceSection
              eventId={eventId}
              currentUserId={user!.id}
              myAttendance={myAttendance}
              attendees={attendanceList}
            />
          )}

          {/* Aportes */}
          <ContributionsSection
            eventId={eventId}
            currentUserId={user!.id}
            contributions={contributions}
            attendees={goingAttendees}
            isUpcoming={event.status === 'upcoming'}
          />

          {/* Gastos */}
          <ExpensesSection
            groupId={groupId}
            eventId={eventId}
            currentUserId={user!.id}
            currentUserName={currentUserName}
            expenses={expenses}
            attendees={goingAttendees}
            settlements={settlements}
          />

          {/* Lista de RSVPs por sección */}
          <div className="flex flex-col gap-6">
            {RSVP_SECTIONS.map(({ status, label, emoji }) => {
              const list = byStatus(status)
              if (list.length === 0) return null

              return (
                <section key={status}>
                  <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <span>{emoji}</span>
                    <span>{label}</span>
                    <span className="font-normal text-muted">({list.length})</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {list.map((rsvp) => (
                      <div
                        key={rsvp.user_id}
                        className="
                          flex items-center gap-2 rounded-full
                          border border-border bg-surface px-3 py-1.5
                        "
                      >
                        {/* Avatar con inicial */}
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-xs font-semibold text-accent">
                          {(rsvp.profiles?.name ?? '?').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-foreground">
                          {rsvp.profiles?.name ?? 'Usuario'}
                          {rsvp.user_id === user!.id && (
                            <span className="ml-1 text-xs text-muted">(vos)</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )
            })}

            {/* Si nadie confirmó todavía */}
            {rsvps.length === 0 && (
              <p className="text-sm text-muted">
                Nadie confirmó todavía. ¡Sé el primero!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
