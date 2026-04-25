import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { GroupTabs } from '@/components/groups/GroupTabs'
import { InviteButton } from '@/components/groups/InviteButton'

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

/* Mismo sistema de colores que GroupCard */
const GROUP_COLORS = [
  'bg-uva/20 text-uva',
  'bg-menta/20 text-menta',
  'bg-ambar/20 text-ambar',
  'bg-fuego/20 text-fuego',
  'bg-rosa/20 text-rosa',
]
function groupColorClass(id: string) {
  return GROUP_COLORS[id.charCodeAt(0) % GROUP_COLORS.length]
}

export default async function GroupLayout({ children, params }: LayoutProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: membership } = await supabase
    .from('group_members')
    .select(`
      role,
      groups ( id, name, description, group_members ( count ) )
    `)
    .eq('group_id', id)
    .eq('user_id', user!.id)
    .single()

  if (!membership || !membership.groups) notFound()

  const group = membership.groups as unknown as {
    id: string
    name: string
    description: string | null
    group_members: { count: number }[]
  }

  const memberCount = (group.group_members[0] as { count: number })?.count ?? 0
  const isAdmin     = membership.role === 'admin'
  const initial     = group.name.trim().charAt(0).toUpperCase()
  const colorClass  = groupColorClass(group.id)

  return (
    <div className="flex flex-col min-h-full">

      {/* ── Volver (mobile only) ──────────────────────────────── */}
      <div className="md:hidden px-5 pt-4 pb-1 bg-surface">
        <Link
          href="/groups"
          className="inline-flex items-center gap-1 font-body text-sm text-muted hover:text-foreground transition-colors"
        >
          ← Volver
        </Link>
      </div>

      {/* ── Header del grupo ──────────────────────────────────── */}
      <div className="border-b border-border bg-surface px-5 py-5 lg:px-8">
        <div className="flex items-center gap-4 max-w-3xl">

          {/* Avatar del grupo */}
          <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl font-heading text-2xl font-bold ${colorClass}`}>
            {initial}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-heading text-xl font-bold text-foreground lg:text-2xl">
                {group.name}
              </h1>
              {isAdmin && (
                <span className="rounded-full bg-fuego/10 px-2.5 py-0.5 font-body text-xs font-semibold text-fuego">
                  Admin
                </span>
              )}
            </div>
            {group.description && (
              <p className="mt-0.5 font-body text-sm text-muted truncate">
                {group.description}
              </p>
            )}
            <p className="mt-1 font-body text-xs text-muted">
              {memberCount} {memberCount === 1 ? 'miembro' : 'miembros'}
            </p>
          </div>

          {isAdmin && <InviteButton groupId={id} />}
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────── */}
      <div className="border-b border-border bg-surface px-5 lg:px-8">
        <GroupTabs groupId={id} isAdmin={isAdmin} />
      </div>

      {children}
    </div>
  )
}
