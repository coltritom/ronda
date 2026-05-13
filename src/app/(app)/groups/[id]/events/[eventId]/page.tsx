import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatEventDate } from '@/lib/utils'
import { CalendarDays, MapPin, ChevronLeft } from 'lucide-react'
import { EventDetailTabs }      from '@/components/events/EventDetailTabs'
import { EventOptionsMenu }     from '@/components/events/EventOptionsMenu'
import type { AporteId } from '@/lib/constants'
import { calcBalances } from '@/lib/utils/debt'

interface PageProps {
  params: Promise<{ id: string; eventId: string }>
}

type RsvpStatus = 'going' | 'maybe' | 'not_going'

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  upcoming:  { label: 'Próxima',       className: 'bg-fuego/[0.12] text-fuego border-fuego/30' },
  completed: { label: '✓ Realizada',  className: 'bg-menta/[0.12] text-menta border-menta/30' },
  cancelled: { label: 'Cancelada',    className: 'bg-error/[0.12] text-error border-error/30' },
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id: groupId, eventId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: membership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (!membership) notFound()

  const [{ data: event }, { data: groupData }] = await Promise.all([
    supabase
      .from('events')
      .select('id, name, description, date, location, status, created_by')
      .eq('id', eventId)
      .eq('group_id', groupId)
      .single(),
    supabase
      .from('groups')
      .select('name')
      .eq('id', groupId)
      .single(),
  ])

  if (!event) notFound()

  const groupName = groupData?.name ?? 'Grupo'
  const canManage = membership.role === 'admin' || event.created_by === user.id
  const isPast = new Date(event.date) < new Date()
  const effectiveStatus = isPast && event.status === 'upcoming' ? 'completed' : event.status
  const badge = STATUS_BADGE[effectiveStatus] ?? STATUS_BADGE.upcoming

  const { data: rsvpsRaw } = await supabase
    .from('event_rsvps')
    .select('response, user_id')
    .eq('event_id', eventId)

  let attendanceRaw: { user_id: string; attended: boolean }[] = []
  const { data: guestData } = await supabase
    .from('event_guests')
    .select('id, name')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })
  const guestsRaw: { id: string; name: string }[] = guestData ?? []
  if (isPast) {
    const { data: attData } = await supabase
      .from('event_attendance')
      .select('user_id, attended')
      .eq('event_id', eventId)
    attendanceRaw = (attData ?? []).map((a) => ({ user_id: a.user_id, attended: a.attended ?? true }))
  }

  const { data: contributionsRaw } = await supabase
    .from('contributions')
    .select('id, category, description, quantity, user_id, guest_name')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })

  type ExpenseSplitRow = { user_id: string | null; guest_name: string | null; amount: number; is_settled: boolean }
  type ExpenseQueryRow = {
    id: string; description: string | null; amount: number
    paid_by: string | null; paid_by_guest_name: string | null; split_type: string | null
    expense_splits: ExpenseSplitRow[]
  }
  const { data: expensesRaw } = await supabase
    .from('expenses')
    .select(`
      id, description, amount, paid_by, paid_by_guest_name, split_type,
      expense_splits ( user_id, guest_name, amount, is_settled )
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })
  const expensesTyped: ExpenseQueryRow[] = (expensesRaw ?? []).map((e) => ({
    id: e.id,
    description: e.description,
    amount: e.amount,
    paid_by: e.paid_by,
    paid_by_guest_name: e.paid_by_guest_name,
    split_type: e.split_type,
    expense_splits: Array.isArray(e.expense_splits) ? e.expense_splits : [],
  }))

  const { data: settlementsRaw } = await supabase
    .from('settlements')
    .select('from_user, to_user, amount')
    .eq('event_id', eventId)

  const allUserIds = new Set<string>([
    ...(rsvpsRaw ?? []).map(r => r.user_id),
    ...attendanceRaw.map(a => a.user_id),
    ...(contributionsRaw ?? []).filter(c => c.user_id).map(c => c.user_id!),
    ...expensesTyped.filter(e => e.paid_by).map(e => e.paid_by!),
    ...expensesTyped.flatMap(e => e.expense_splits.filter(s => s.user_id).map(s => s.user_id!)),
  ])
  const { data: profilesData } = allUserIds.size > 0
    ? await supabase.from('profiles').select('id, name').in('id', [...allUserIds])
    : { data: [] as { id: string; name: string }[] }
  const profileMap: Record<string, string> = Object.fromEntries(
    (profilesData ?? []).map(p => [p.id, p.name ?? 'Usuario'])
  )

  type RsvpEnriched = { response: RsvpStatus; user_id: string; profiles: { name: string } }
  const rsvps: RsvpEnriched[] = (rsvpsRaw ?? []).map(r => ({
    response: r.response as RsvpStatus,
    user_id: r.user_id,
    profiles: { name: profileMap[r.user_id] ?? 'Usuario' },
  }))

  const myRsvp = rsvps.find((r) => r.user_id === user.id)?.response ?? null
  const going  = rsvps.filter((r) => r.response === 'going')
  const maybe  = rsvps.filter((r) => r.response === 'maybe')

  const goingAttendees = going.map((r) => ({
    user_id: r.user_id,
    name:    r.profiles?.name ?? 'Usuario',
  }))

  const currentUserName = profileMap[user.id] ?? 'Yo'

  let attendanceList: { user_id: string; name: string }[] = []
  let myAttendance: boolean | null = null
  if (isPast) {
    attendanceList = attendanceRaw
      .filter((a) => a.attended)
      .map((a) => ({ user_id: a.user_id, name: profileMap[a.user_id] ?? 'Usuario' }))
    const myRecord = attendanceRaw.find((a) => a.user_id === user.id)
    myAttendance = myRecord !== undefined ? myRecord.attended : null
  }

  const suggestedAttendance: boolean | null =
    myAttendance !== null  ? null :
    myRsvp === 'going'     ? true :
    myRsvp === 'not_going' ? false :
    null

  type ContributionEnriched = {
    id: string; category: AporteId; description: string | null
    quantity: number; user_id: string | null; guest_name: string | null; profiles: { name: string }
  }
  const contributions: ContributionEnriched[] = (contributionsRaw ?? []).map(c => ({
    id: c.id,
    category: c.category as AporteId,
    description: c.description,
    quantity: c.quantity,
    user_id: c.user_id,
    guest_name: c.guest_name ?? null,
    profiles: { name: c.user_id ? (profileMap[c.user_id] ?? 'Usuario') : (c.guest_name ?? 'Invitado') },
  }))

  type ExpenseEnriched = {
    id: string; description: string | null; amount: number
    paid_by: string | null; paid_by_guest_name: string | null; split_type: string | null
    profiles: { name: string }
    expense_splits: { user_id: string | null; guest_name: string | null; amount: number; is_settled: boolean; profiles: { name: string } }[]
  }
  const expenses: ExpenseEnriched[] = expensesTyped.map(e => ({
    ...e,
    profiles: { name: e.paid_by ? (profileMap[e.paid_by] ?? 'Usuario') : (e.paid_by_guest_name ?? 'Invitado') },
    expense_splits: e.expense_splits.map(s => ({
      ...s,
      profiles: { name: s.user_id ? (profileMap[s.user_id] ?? 'Usuario') : (s.guest_name ?? 'Invitado') },
    })),
  }))

  const settlements = (settlementsRaw ?? []) as {
    from_user: string; to_user: string; amount: number
  }[]

  const balances = calcBalances(expenses, settlements, (uid, fallback) => profileMap[uid] ?? fallback)
  const hasPendingDebt = (balances.find((b) => b.userId === user.id)?.net ?? 0) < -0.005

  const tabs = [
    {
      id:    'asistencia',
      label: 'Asistencia',
      count: going.length + maybe.length,
    },
    { id: 'aportes', label: 'Aportes', count: contributions.length },
    { id: 'gastos',  label: 'Gastos',  count: expenses.length },
    { id: 'cuentas', label: 'Cuentas', alert: hasPendingDebt },
  ]

  return (
    <div className="max-w-2xl mx-auto pb-8">

      {/* Header */}
      <div className="px-4 md:px-6 pt-4 pb-2">
        <Link
          href={`/groups/${groupId}`}
          className="flex items-center gap-1 text-fuego text-[13px] font-semibold mb-3"
        >
          <ChevronLeft size={16} />
          {groupName}
        </Link>

        <div className="flex items-start justify-between gap-3">
          <h1 className="font-display font-bold text-[22px] text-humo">
            {event.name}
          </h1>
          <div className="flex items-center gap-1.5 shrink-0 mt-1">
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${badge.className}`}>
              {badge.label}
            </span>
            {canManage && (
              <EventOptionsMenu
                eventId={eventId}
                groupId={groupId}
                initialName={event.name}
                initialDate={event.date}
                initialLocation={event.location}
                initialDescription={event.description}
                initialStatus={event.status}
              />
            )}
          </div>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
          <div className="flex items-center gap-1.5 text-sm text-niebla">
            <CalendarDays size={13} />
            <span className="capitalize">{formatEventDate(event.date)}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-1.5 text-sm text-niebla">
              <MapPin size={13} />
              <span>{event.location}</span>
            </div>
          )}
        </div>

        {event.description && (
          <p className="mt-2 text-sm text-niebla leading-relaxed">{event.description}</p>
        )}
      </div>

      {/* Tabs + contenido (client-side switching, sin re-fetch) */}
      <div className="px-4 md:px-6 mt-3">
        <EventDetailTabs
          tabs={tabs}
          defaultTab="asistencia"
          isPast={isPast}
          eventId={eventId}
          groupId={groupId}
          currentUserId={user.id}
          currentUserName={currentUserName}
          canAdd={event.status !== 'cancelled'}
          myRsvp={myRsvp}
          rsvps={rsvps}
          myAttendance={myAttendance}
          suggestedAttendance={suggestedAttendance}
          attendees={attendanceList}
          guests={guestsRaw}
          goingAttendees={goingAttendees}
          contributions={contributions}
          expenses={expenses}
          settlements={settlements}
        />
      </div>
    </div>
  )
}
