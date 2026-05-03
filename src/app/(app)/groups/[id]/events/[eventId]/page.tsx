import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatEventDate } from '@/lib/utils'
import { CalendarDays, MapPin, ChevronRight } from 'lucide-react'
import { RsvpButtons }        from '@/components/events/RsvpButtons'
import { AttendanceSection }  from '@/components/events/AttendanceSection'
import { ContributionsSection } from '@/components/events/ContributionsSection'
import { ExpensesSection }    from '@/components/events/ExpensesSection'
import { CuentasSection }     from '@/components/events/CuentasSection'
import { EventTabs }          from '@/components/events/EventTabs'

interface PageProps {
  params:       Promise<{ id: string; eventId: string }>
  searchParams: Promise<{ tab?: string }>
}

type RsvpStatus = 'going' | 'maybe' | 'not_going'

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  upcoming:  { label: 'Próxima',   className: 'bg-fuego/10 text-fuego' },
  completed: { label: 'Realizada', className: 'bg-exito/10 text-exito' },
  cancelled: { label: 'Cancelada', className: 'bg-error/10 text-error' },
}

export default async function EventDetailPage({ params, searchParams }: PageProps) {
  const { id: groupId, eventId } = await params
  const { tab = 'asistencia' }   = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  /* ── Verificar membresía ──────────────────────────────────── */
  const { data: membership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
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

  const effectiveStatus = isPast && event.status === 'upcoming' ? 'completed' : event.status
  const badge = STATUS_BADGE[effectiveStatus] ?? STATUS_BADGE.upcoming

  /* ── RSVPs ────────────────────────────────────────────────── */
  const { data: rsvpsRaw } = await supabase
    .from('event_rsvps')
    .select('response, user_id')
    .eq('event_id', eventId)

  /* ── Asistencia real (solo eventos pasados) ───────────────── */
  let attendanceRaw: { user_id: string }[] = []
  if (isPast) {
    const { data } = await supabase
      .from('event_attendance')
      .select('user_id')
      .eq('event_id', eventId)
    attendanceRaw = data ?? []
  }

  /* ── Aportes ─────────────────────────────────────────────── */
  const { data: contributionsRaw } = await supabase
    .from('contributions')
    .select('id, category, description, quantity, user_id')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })

  /* ── Gastos + splits ─────────────────────────────────────── */
  type ExpenseSplitRow = { user_id: string; amount: number; is_settled: boolean }
  type ExpenseQueryRow = {
    id: string; description: string | null; amount: number
    paid_by: string; split_type: string | null
    expense_splits: ExpenseSplitRow[]
  }
  const { data: expensesRaw } = await supabase
    .from('expenses')
    .select(`
      id, description, amount, paid_by, split_type,
      expense_splits ( user_id, amount, is_settled )
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })
  const expensesTyped = (expensesRaw ?? []) as ExpenseQueryRow[]

  /* ── Settlements ─────────────────────────────────────────── */
  const { data: settlementsRaw } = await supabase
    .from('settlements')
    .select('from_user, to_user, amount')
    .eq('event_id', eventId)

  /* ── Profiles (single lookup for all queries) ────────────── */
  const allUserIds = new Set<string>([
    ...(rsvpsRaw ?? []).map(r => r.user_id),
    ...attendanceRaw.map(a => a.user_id),
    ...(contributionsRaw ?? []).map(c => c.user_id),
    ...expensesTyped.map(e => e.paid_by),
    ...expensesTyped.flatMap(e => e.expense_splits.map(s => s.user_id)),
  ])
  const { data: profilesData } = allUserIds.size > 0
    ? await supabase.from('profiles').select('id, name').in('id', [...allUserIds])
    : { data: [] as { id: string; name: string }[] }
  const profileMap: Record<string, string> = Object.fromEntries(
    (profilesData ?? []).map(p => [p.id, p.name ?? 'Usuario'])
  )

  /* ── Enriquecer datos con nombres ────────────────────────── */
  type RsvpEnriched = { response: RsvpStatus; user_id: string; profiles: { name: string } }
  const rsvps: RsvpEnriched[] = (rsvpsRaw ?? []).map(r => ({
    response: r.response as RsvpStatus,
    user_id: r.user_id,
    profiles: { name: profileMap[r.user_id] ?? 'Usuario' },
  }))

  const myRsvp   = rsvps.find((r) => r.user_id === user.id)?.response ?? null
  const going    = rsvps.filter((r) => r.response === 'going')
  const maybe    = rsvps.filter((r) => r.response === 'maybe')
  const notGoing = rsvps.filter((r) => r.response === 'not_going')

  const goingAttendees = going.map((r) => ({
    user_id: r.user_id,
    name:    r.profiles?.name ?? 'Usuario',
  }))

  const currentUserName = profileMap[user.id] ?? 'Yo'

  let attendanceList: { user_id: string; name: string }[] = []
  let myAttendance = false

  if (isPast) {
    attendanceList = attendanceRaw.map((a) => ({
      user_id: a.user_id,
      name: profileMap[a.user_id] ?? 'Usuario',
    }))
    myAttendance = attendanceList.some((a) => a.user_id === user.id)
  }

  type ContributionCategory = 'bebida' | 'comida' | 'postre' | 'hielo' | 'snacks' | 'juegos' | 'utensilios' | 'otros'
  type ContributionEnriched = {
    id: string; category: ContributionCategory; description: string | null
    quantity: number; user_id: string; profiles: { name: string }
  }
  const contributions: ContributionEnriched[] = (contributionsRaw ?? []).map(c => ({
    id: c.id,
    category: c.category as ContributionCategory,
    description: c.description,
    quantity: c.quantity,
    user_id: c.user_id,
    profiles: { name: profileMap[c.user_id] ?? 'Usuario' },
  }))

  type ExpenseEnriched = {
    id: string; description: string | null; amount: number
    paid_by: string; split_type: string | null
    profiles: { name: string }
    expense_splits: { user_id: string; amount: number; is_settled: boolean; profiles: { name: string } }[]
  }
  const expenses: ExpenseEnriched[] = expensesTyped.map(e => ({
    ...e,
    profiles: { name: profileMap[e.paid_by] ?? 'Usuario' },
    expense_splits: e.expense_splits.map(s => ({
      ...s,
      profiles: { name: profileMap[s.user_id] ?? 'Usuario' },
    })),
  }))

  const settlements = (settlementsRaw ?? []) as {
    from_user: string; to_user: string; amount: number
  }[]

  /* ── Deuda pendiente del usuario (para badge en tab) ─────── */
  const myPendingSplits = expenses.flatMap((e) =>
    e.expense_splits.filter((s) => s.user_id === user.id && !s.is_settled)
  )
  const hasPendingDebt = myPendingSplits.length > 0

  /* ── Tabs ────────────────────────────────────────────────── */
  const tabs = [
    {
      id:    'asistencia',
      label: 'Asistencia',
      count: isPast ? attendanceList.length : going.length + maybe.length,
    },
    { id: 'aportes', label: 'Aportes', count: contributions.length },
    { id: 'gastos',  label: 'Gastos',  count: expenses.length },
    { id: 'cuentas', label: 'Cuentas', alert: hasPendingDebt },
  ]

  const activeTab = tabs.some((t) => t.id === tab) ? tab : 'asistencia'

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div className="flex flex-col min-h-full">

      {/* ── Header del evento ─────────────────────────────────── */}
      <div className="border-b border-border bg-surface px-5 py-5 lg:px-8">
        <div className="max-w-2xl">
          {/* Breadcrumb */}
          <nav className="mb-3 flex items-center gap-1 font-body text-xs text-muted">
            <Link href={`/groups/${groupId}`} className="hover:text-foreground transition-colors">
              Grupo
            </Link>
            <ChevronRight size={12} className="text-muted/50" />
            <span className="text-foreground">Juntada</span>
          </nav>

          {/* Título + badge */}
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-heading text-xl font-bold text-foreground lg:text-2xl">
              {event.name}
            </h1>
            <span className={`mt-0.5 flex-shrink-0 rounded-full px-2.5 py-0.5 font-body text-xs font-semibold ${badge.className}`}>
              {badge.label}
            </span>
          </div>

          {/* Meta info */}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <div className="flex items-center gap-1.5 font-body text-sm text-muted">
              <CalendarDays size={13} />
              <span className="capitalize">{formatEventDate(event.date)}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-1.5 font-body text-sm text-muted">
                <MapPin size={13} />
                <span>{event.location}</span>
              </div>
            )}
          </div>

          {event.description && (
            <p className="mt-2 font-body text-sm leading-relaxed text-muted">
              {event.description}
            </p>
          )}
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────── */}
      <EventTabs
        tabs={tabs}
        activeTab={activeTab}
        groupId={groupId}
        eventId={eventId}
      />

      {/* ── Contenido por tab ─────────────────────────────────── */}
      <div className="flex-1 p-5 lg:p-8">
        <div className="max-w-2xl">

          {/* ── Asistencia ──────────────────────────────────────── */}
          {activeTab === 'asistencia' && (
            <div className="flex flex-col gap-6">

              {/* Botones RSVP (próximas) o toggle asistencia (pasadas) */}
              {!isPast && (
                <RsvpButtons eventId={eventId} currentStatus={myRsvp} />
              )}
              {isPast && (
                <AttendanceSection
                  eventId={eventId}
                  currentUserId={user.id}
                  myAttendance={myAttendance}
                  attendees={attendanceList}
                />
              )}

              {/* Lista de RSVPs */}
              {!isPast && (
                <div className="flex flex-col gap-4">
                  {[
                    { status: 'going'     as RsvpStatus, label: 'Van',     list: going,    color: 'text-exito' },
                    { status: 'maybe'     as RsvpStatus, label: 'Tal vez', list: maybe,    color: 'text-ambar' },
                    { status: 'not_going' as RsvpStatus, label: 'No van',  list: notGoing, color: 'text-error' },
                  ]
                    .filter(({ list }) => list.length > 0)
                    .map(({ label, list, color }) => (
                      <div key={label}>
                        <p className={`mb-2 font-body text-xs font-semibold uppercase tracking-wider ${color}`}>
                          {label} ({list.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {list.map((rsvp) => (
                            <div
                              key={rsvp.user_id}
                              className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5"
                            >
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-fuego/20 font-body text-[10px] font-bold text-fuego">
                                {(rsvp.profiles?.name ?? '?').charAt(0).toUpperCase()}
                              </div>
                              <span className="font-body text-sm text-foreground">
                                {rsvp.profiles?.name ?? 'Usuario'}
                                {rsvp.user_id === user.id && (
                                  <span className="ml-1 text-xs text-muted">(vos)</span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  }
                  {rsvps.length === 0 && (
                    <p className="font-body text-sm text-muted">
                      Nadie confirmó todavía. ¡Sé el primero!
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Aportes ─────────────────────────────────────────── */}
          {activeTab === 'aportes' && (
            <ContributionsSection
              eventId={eventId}
              currentUserId={user.id}
              contributions={contributions}
              isUpcoming={!isPast && event.status !== 'cancelled'}
            />
          )}

          {/* ── Gastos ──────────────────────────────────────────── */}
          {activeTab === 'gastos' && (
            <ExpensesSection
              groupId={groupId}
              eventId={eventId}
              currentUserId={user.id}
              currentUserName={currentUserName}
              expenses={expenses}
              attendees={goingAttendees}
              settlements={settlements}
            />
          )}

          {/* ── Cuentas ─────────────────────────────────────────── */}
          {activeTab === 'cuentas' && (
            <CuentasSection
              groupId={groupId}
              eventId={eventId}
              currentUserId={user.id}
              currentUserName={currentUserName}
              expenses={expenses}
              attendees={goingAttendees}
              settlements={settlements}
            />
          )}

        </div>
      </div>
    </div>
  )
}
