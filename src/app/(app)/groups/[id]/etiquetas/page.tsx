import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface PageProps {
  params: Promise<{ id: string }>
}

interface Tag {
  label: string
  emoji: string
  description: string
  color: string
}

/* ── Definición de las 11 etiquetas ──────────────────────────── */
const TAG_DEFS = {
  veterano:    { label: 'El Veterano',         emoji: '🏆', description: 'El que más tiempo lleva en el grupo',      color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' },
  nuevo:       { label: 'El Nuevo',            emoji: '🌱', description: 'El último en sumarse',                     color: 'bg-green-500/10 text-green-600 border-green-500/30' },
  organizador: { label: 'El Organizador',      emoji: '📋', description: 'Siempre arma los planes',                  color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  provisto:    { label: 'El Provisto',         emoji: '🎒', description: 'Siempre trae algo',                        color: 'bg-purple-500/10 text-purple-600 border-purple-500/30' },
  mecenas:     { label: 'El Mecenas',          emoji: '💸', description: 'Siempre pone la guita',                    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
  fijo:        { label: 'El Fijo',             emoji: '📅', description: 'No falta a ninguna',                       color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30' },
  fantasma:    { label: 'El Fantasma',         emoji: '👻', description: 'Casi nunca aparece',                       color: 'bg-slate-500/10 text-slate-500 border-slate-500/30' },
  indeciso:    { label: 'El Indeciso',         emoji: '🤷', description: 'Siempre capaz que va',                     color: 'bg-orange-500/10 text-orange-600 border-orange-500/30' },
  caradura:    { label: 'El Cara Dura',        emoji: '😏', description: 'Va a todo pero nunca pone un mango',       color: 'bg-red-500/10 text-red-500 border-red-500/30' },
  ausente:     { label: 'El Ausente Digital',  emoji: '📵', description: 'Nunca confirma nada',                      color: 'bg-gray-500/10 text-gray-500 border-gray-500/30' },
  mvp:         { label: 'El MVP',              emoji: '⭐', description: 'El más comprometido del grupo',            color: 'bg-accent/10 text-accent border-accent/30' },
} as const

type TagKey = keyof typeof TAG_DEFS

/* ── Lógica de asignación ─────────────────────────────────────── */
function assignTags(
  member: {
    userId: string
    joinedAt: string
    attendance: number
    maybeCount: number
    eventsCreated: number
    contributions: number
    expensesPaid: number
  },
  group: {
    totalEvents: number
    oldestJoin: string
    newestJoin: string
    maxEventsCreated: number
    maxContributions: number
    maxExpensesPaid: number
    memberCount: number
  }
): TagKey[] {
  const tags: TagKey[] = []
  const { totalEvents } = group

  /* Veterano / Nuevo (solo si hay más de un miembro) */
  if (group.memberCount > 1) {
    if (member.joinedAt === group.oldestJoin) tags.push('veterano')
    if (member.joinedAt === group.newestJoin)  tags.push('nuevo')
  }

  /* Organizador */
  if (member.eventsCreated > 0 && member.eventsCreated === group.maxEventsCreated)
    tags.push('organizador')

  /* Provisto */
  if (member.contributions > 0 && member.contributions === group.maxContributions)
    tags.push('provisto')

  /* Mecenas */
  if (member.expensesPaid > 0 && member.expensesPaid === group.maxExpensesPaid)
    tags.push('mecenas')

  /* Fijo — asistencia ≥ 80% con al menos 3 eventos */
  if (totalEvents >= 3 && member.attendance / totalEvents >= 0.8)
    tags.push('fijo')

  /* Fantasma — asistencia ≤ 20% con al menos 3 eventos */
  if (totalEvents >= 3 && member.attendance / totalEvents <= 0.2)
    tags.push('fantasma')

  /* Ausente digital — nunca confirmó asistencia (con al menos 2 eventos) */
  if (totalEvents >= 2 && member.attendance === 0 && member.maybeCount === 0)
    tags.push('ausente')

  /* Indeciso — ≥ 3 maybe y es el que más maybe tiene */
  if (member.maybeCount >= 3)
    tags.push('indeciso')

  /* Cara dura — fue a ≥ 2 juntadas pero $0 gastos y 0 aportes */
  if (member.attendance >= 2 && member.expensesPaid === 0 && member.contributions === 0)
    tags.push('caradura')

  /* MVP — score compuesto: asistencia normalizada + aportes norm + gastos norm */
  /* Se asigna al final si no tiene otras etiquetas positivas, o siempre al top */

  return tags
}

export default async function EtiquetasPage({ params }: PageProps) {
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

  /* ── Miembros ──────────────────────────────────────────────── */
  const { data: membersRaw } = await supabase
    .from('group_members')
    .select('user_id, created_at')
    .eq('group_id', groupId)
    .order('created_at', { ascending: true })

  const memberUserIds = (membersRaw ?? []).map(m => m.user_id)
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', memberUserIds)
  const profileMap = Object.fromEntries((profilesData ?? []).map(p => [p.id, p.name]))

  const members = (membersRaw ?? []).map((m) => ({
    userId:   m.user_id,
    name:     profileMap[m.user_id] ?? 'Usuario',
    joinedAt: m.created_at as string,
  }))

  /* ── Eventos del grupo ─────────────────────────────────────── */
  const { data: eventsRaw } = await supabase
    .from('events')
    .select('id, created_by')
    .eq('group_id', groupId)

  const events     = eventsRaw ?? []
  const eventIds   = events.map((e) => e.id)
  const totalEvents = events.length

  /* ── Datos agregados ───────────────────────────────────────── */
  const attendanceMap:    Record<string, number> = {}
  const maybeMap:         Record<string, number> = {}
  const eventsCreatedMap: Record<string, number> = {}
  const contributionsMap: Record<string, number> = {}
  const expensesMap:      Record<string, number> = {}

  /* Eventos creados */
  for (const e of events)
    eventsCreatedMap[e.created_by] = (eventsCreatedMap[e.created_by] ?? 0) + 1

  if (eventIds.length > 0) {
    const [{ data: attendance }, { data: rsvps }, { data: contribs }, { data: expenses }] = await Promise.all([
      supabase.from('event_attendance').select('user_id').in('event_id', eventIds),
      supabase.from('event_rsvps').select('user_id, response').in('event_id', eventIds),
      supabase.from('contributions').select('user_id').in('event_id', eventIds),
      supabase.from('expenses').select('paid_by, amount').in('event_id', eventIds),
    ])

    for (const r of attendance ?? [])
      attendanceMap[r.user_id] = (attendanceMap[r.user_id] ?? 0) + 1

    for (const r of rsvps ?? []) {
      if (r.response === 'maybe')
        maybeMap[r.user_id] = (maybeMap[r.user_id] ?? 0) + 1
    }
    for (const c of contribs ?? [])
      contributionsMap[c.user_id] = (contributionsMap[c.user_id] ?? 0) + 1
    for (const e of expenses ?? [])
      expensesMap[e.paid_by] = (expensesMap[e.paid_by] ?? 0) + Number(e.amount)
  }

  /* ── Máximos del grupo ─────────────────────────────────────── */
  const maxEventsCreated = Math.max(0, ...Object.values(eventsCreatedMap))
  const maxContributions = Math.max(0, ...Object.values(contributionsMap))
  const maxExpensesPaid  = Math.max(0, ...Object.values(expensesMap))
  const oldestJoin       = members[0]?.joinedAt ?? ''
  const newestJoin       = members[members.length - 1]?.joinedAt ?? ''

  const groupStats = {
    totalEvents,
    oldestJoin,
    newestJoin,
    maxEventsCreated,
    maxContributions,
    maxExpensesPaid,
    memberCount: members.length,
  }

  /* ── Calcular score MVP ────────────────────────────────────── */
  const memberStats = members.map((m) => ({
    ...m,
    attendance:    attendanceMap[m.userId]    ?? 0,
    maybeCount:    maybeMap[m.userId]         ?? 0,
    eventsCreated: eventsCreatedMap[m.userId] ?? 0,
    contributions: contributionsMap[m.userId] ?? 0,
    expensesPaid:  expensesMap[m.userId]      ?? 0,
  }))

  /* Score normalizado 0-1 por categoría, promediado */
  const maxAttendance = Math.max(1, ...memberStats.map((m) => m.attendance))
  const mvpScores = memberStats.map((m) => ({
    userId: m.userId,
    score:
      (m.attendance / maxAttendance) * 0.4 +
      (maxContributions > 0 ? m.contributions / maxContributions : 0) * 0.3 +
      (maxExpensesPaid > 0 ? m.expensesPaid / maxExpensesPaid : 0) * 0.3,
  }))
  const maxScore  = Math.max(...mvpScores.map((s) => s.score))
  const mvpUserId = maxScore > 0 ? mvpScores.find((s) => s.score === maxScore)?.userId : null

  /* ── Asignar etiquetas ─────────────────────────────────────── */
  const results = memberStats.map((m) => {
    const tagKeys = assignTags(m, groupStats)
    if (m.userId === mvpUserId && !tagKeys.includes('mvp'))
      tagKeys.unshift('mvp')
    return {
      ...m,
      tags: tagKeys.map((k) => ({ key: k, ...TAG_DEFS[k] }) as Tag & { key: TagKey }),
    }
  })

  return (
    <div className="flex-1 p-6 lg:p-8">
      <div className="max-w-2xl">
        <h2 className="font-heading mb-1 text-lg font-semibold text-foreground">
          Etiquetas
        </h2>
        <p className="mb-6 text-sm text-muted">
          Auto-generadas según el comportamiento de cada uno.
        </p>

        {totalEvents === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface py-12 text-center">
            <p className="text-sm text-muted">
              Todavía no hay juntadas para generar etiquetas.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {results.map((m) => (
              <div
                key={m.userId}
                className={`rounded-2xl border px-5 py-4 ${
                  m.userId === user!.id
                    ? 'border-accent/30 bg-accent/5'
                    : 'border-border bg-surface'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-bold text-foreground">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {m.userId === user!.id ? 'Yo' : m.name}
                      </p>
                      <p className="text-xs text-muted">
                        {m.attendance} juntadas · {m.contributions} aportes
                      </p>
                    </div>
                  </div>
                </div>

                {m.tags.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {m.tags.map((tag) => (
                      <span
                        key={tag.key}
                        title={tag.description}
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${tag.color}`}
                      >
                        {tag.emoji} {tag.label}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-muted italic">
                    Sin etiqueta todavía — hace falta más actividad.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
