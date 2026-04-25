import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Check, Minus } from 'lucide-react'

interface EventRow {
  eventId: string
  eventName: string
  eventDate: string
  attended: boolean
}

interface GroupSection {
  groupId: string
  groupName: string
  events: EventRow[]
  attendedCount: number
}

export default async function AsistenciaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id, groups(name)')
    .eq('user_id', user.id)

  const groupMap: Record<string, string> = {}
  for (const m of memberships ?? []) {
    groupMap[(m as any).group_id] = (m as any).groups?.name ?? 'Grupo'
  }
  const groupIds = Object.keys(groupMap)

  if (groupIds.length === 0) {
    return (
      <EmptyState
        icon="📅"
        title="Sin juntadas"
        sub="No estás en ningún grupo todavía."
      />
    )
  }

  const now = new Date().toISOString()

  const [{ data: eventsRaw }, { data: attendanceRaw }] = await Promise.all([
    supabase
      .from('events')
      .select('id, name, date, group_id')
      .in('group_id', groupIds)
      .neq('status', 'cancelled')
      .lte('date', now)
      .order('date', { ascending: false }),
    supabase
      .from('event_attendance')
      .select('event_id')
      .eq('user_id', user.id),
  ])

  const events = eventsRaw ?? []
  const attendedIds = new Set((attendanceRaw ?? []).map((a) => a.event_id))

  if (events.length === 0) {
    return (
      <EmptyState
        icon="📅"
        title="Sin juntadas pasadas"
        sub="Todavía no hay juntadas anteriores en tus grupos."
      />
    )
  }

  const byGroup: Record<string, GroupSection> = {}
  for (const event of events) {
    const gid = event.group_id
    if (!byGroup[gid]) {
      byGroup[gid] = {
        groupId: gid,
        groupName: groupMap[gid] ?? 'Grupo',
        events: [],
        attendedCount: 0,
      }
    }
    const attended = attendedIds.has(event.id)
    byGroup[gid].events.push({
      eventId: event.id,
      eventName: event.name,
      eventDate: event.date,
      attended,
    })
    if (attended) byGroup[gid].attendedCount++
  }

  const sections = Object.values(byGroup)
  const totalAttended = sections.reduce((s, g) => s + g.attendedCount, 0)
  const totalEvents   = events.length

  return (
    <div className="p-5 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/home"
          className="inline-block font-body text-sm text-muted hover:text-foreground transition-colors mb-5"
        >
          ← Volver
        </Link>

        <div className="mb-5">
          <h1 className="font-display font-bold text-xl text-foreground">Mi asistencia</h1>
          <p className="font-body text-sm text-muted mt-0.5">
            {totalAttended} de {totalEvents} juntada{totalEvents !== 1 ? 's' : ''} asistida{totalEvents !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="space-y-5">
          {sections.map((section) => (
            <div key={section.groupId}>
              <div className="flex items-baseline justify-between mb-2 px-1">
                <p className="font-body text-xs font-semibold text-muted uppercase tracking-wider">
                  {section.groupName}
                </p>
                <p className="font-body text-xs text-muted">
                  {section.attendedCount}/{section.events.length}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-surface overflow-hidden divide-y divide-border">
                {section.events.map((event) => (
                  <Link
                    key={event.eventId}
                    href={`/groups/${section.groupId}/events/${event.eventId}`}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface/80 transition-colors"
                  >
                    <div
                      className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                        event.attended
                          ? 'bg-fuego/15 text-fuego'
                          : 'bg-border text-muted'
                      }`}
                    >
                      {event.attended ? (
                        <Check size={12} strokeWidth={2.5} />
                      ) : (
                        <Minus size={12} strokeWidth={2} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`font-body text-sm font-medium truncate ${event.attended ? 'text-foreground' : 'text-muted'}`}>
                        {event.eventName}
                      </p>
                      <p className="font-body text-xs text-muted mt-0.5">
                        {new Date(event.eventDate).toLocaleDateString('es-AR', {
                          weekday: 'long', day: 'numeric', month: 'long',
                        })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div className="p-5 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/home"
          className="inline-block font-body text-sm text-muted hover:text-foreground transition-colors mb-5"
        >
          ← Volver
        </Link>
        <div className="text-center py-16">
          <div className="text-3xl mb-3">{icon}</div>
          <p className="font-body font-semibold text-foreground">{title}</p>
          <p className="font-body text-sm text-muted mt-1">{sub}</p>
        </div>
      </div>
    </div>
  )
}
