import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface PageProps {
  params: Promise<{ id: string }>
}

interface RankEntry {
  user_id: string
  name: string
  value: number
}

const MEDALS = ['🥇', '🥈', '🥉']

function RankingList({
  title,
  emoji,
  entries,
  currentUserId,
  format,
}: {
  title: string
  emoji: string
  entries: RankEntry[]
  currentUserId: string
  format: (v: number) => string
}) {
  const allZero = entries.every((e) => e.value === 0)

  return (
    <section>
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <span>{emoji}</span>
        <span>{title}</span>
      </p>
      {allZero ? (
        <p className="text-sm text-muted">Sin datos todavía.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((entry, i) => (
            <div
              key={entry.user_id}
              className={`
                flex items-center gap-3 rounded-xl border px-4 py-2.5
                ${entry.user_id === currentUserId
                  ? 'border-accent/40 bg-accent/5'
                  : 'border-border bg-surface'
                }
              `}
            >
              <span className="w-6 text-center text-base leading-none">
                {MEDALS[i] ?? (
                  <span className="text-xs font-medium text-muted">{i + 1}</span>
                )}
              </span>
              <span className="flex-1 text-sm text-foreground">
                {entry.user_id === currentUserId ? 'Yo' : entry.name}
                {entry.user_id === currentUserId && (
                  <span className="ml-1.5 text-xs text-muted">(vos)</span>
                )}
              </span>
              <span className="text-sm font-semibold text-accent">
                {format(entry.value)}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default async function RankingsPage({ params }: PageProps) {
  const { id: groupId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  /* Verificar membresía */
  const { data: membership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user!.id)
    .single()

  if (!membership) notFound()

  /* ── Miembros con nombre ─────────────────────────────────── */
  const { data: membersRaw } = await supabase
    .from('group_members')
    .select('user_id, profiles ( name )')
    .eq('group_id', groupId)

  const members = (membersRaw ?? []) as unknown as {
    user_id: string
    profiles: { name: string } | null
  }[]

  /* ── IDs de todos los eventos del grupo ──────────────────── */
  const { data: eventsRaw } = await supabase
    .from('events')
    .select('id')
    .eq('group_id', groupId)

  const eventIds = (eventsRaw ?? []).map((e) => e.id)

  /* ── Conteos y totales ───────────────────────────────────── */
  const attendanceMap:   Record<string, number> = {}
  const contributionMap: Record<string, number> = {}
  const expenseMap:      Record<string, number> = {}

  if (eventIds.length > 0) {
    const [{ data: attendance }, { data: contribs }, { data: expenses }] = await Promise.all([
      supabase
        .from('event_attendance')
        .select('user_id')
        .in('event_id', eventIds),
      supabase
        .from('contributions')
        .select('user_id')
        .in('event_id', eventIds),
      supabase
        .from('expenses')
        .select('paid_by, amount')
        .in('event_id', eventIds),
    ])

    for (const r of attendance ?? [])
      attendanceMap[r.user_id] = (attendanceMap[r.user_id] ?? 0) + 1

    for (const c of contribs ?? [])
      contributionMap[c.user_id] = (contributionMap[c.user_id] ?? 0) + 1

    for (const e of expenses ?? [])
      expenseMap[e.paid_by] = (expenseMap[e.paid_by] ?? 0) + e.amount
  }

  /* ── Armar stats por miembro ─────────────────────────────── */
  const stats = members.map((m) => ({
    user_id:       m.user_id,
    name:          m.profiles?.name ?? 'Usuario',
    attendance:    attendanceMap[m.user_id]   ?? 0,
    contributions: contributionMap[m.user_id] ?? 0,
    expenses:      expenseMap[m.user_id]      ?? 0,
  }))

  const byAttendance    = [...stats].sort((a, b) => b.attendance    - a.attendance)
  const byContributions = [...stats].sort((a, b) => b.contributions - a.contributions)
  const byExpenses      = [...stats].sort((a, b) => b.expenses      - a.expenses)

  return (
    <div className="flex-1 p-6 lg:p-8">
      <div className="max-w-2xl flex flex-col gap-8">

        <RankingList
          title="Asistencia"
          emoji="📅"
          entries={byAttendance.map((s) => ({ user_id: s.user_id, name: s.name, value: s.attendance }))}
          currentUserId={user!.id}
          format={(v) => `${v} ${v === 1 ? 'juntada' : 'juntadas'}`}
        />

        <RankingList
          title="Aportes"
          emoji="🎒"
          entries={byContributions.map((s) => ({ user_id: s.user_id, name: s.name, value: s.contributions }))}
          currentUserId={user!.id}
          format={(v) => `${v} ${v === 1 ? 'aporte' : 'aportes'}`}
        />

        <RankingList
          title="Gastos pagados"
          emoji="💸"
          entries={byExpenses.map((s) => ({ user_id: s.user_id, name: s.name, value: s.expenses }))}
          currentUserId={user!.id}
          format={(v) => `$${v.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`}
        />

      </div>
    </div>
  )
}
