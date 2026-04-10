import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GroupTabs } from '@/components/groups/GroupTabs'
import { InviteButton } from '@/components/groups/InviteButton'

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ id: string }>
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

  const group = membership.groups as {
    id: string
    name: string
    description: string | null
    group_members: { count: number }[]
  }

  const memberCount = (group.group_members[0] as { count: number })?.count ?? 0
  const isAdmin = membership.role === 'admin'

  return (
    <div className="flex flex-col min-h-full">

      {/* ── Header del grupo ──────────────────────────────────── */}
      <div className="border-b border-border bg-surface px-6 py-6 lg:px-8">
        <div className="flex items-start gap-4 max-w-4xl">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-3xl">
            👥
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-heading text-2xl font-bold text-foreground">
                {group.name}
              </h1>
              {isAdmin && (
                <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                  Admin
                </span>
              )}
            </div>
            {group.description && (
              <p className="mt-1 text-sm text-muted">{group.description}</p>
            )}
            <p className="mt-1.5 text-xs text-muted">
              {memberCount} {memberCount === 1 ? 'miembro' : 'miembros'}
            </p>
          </div>

          {isAdmin
            ? <InviteButton groupId={id} />
            : null
          }
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────── */}
      <div className="border-b border-border bg-surface px-6 lg:px-8">
        <GroupTabs groupId={id} isAdmin={isAdmin} />
      </div>

      {children}
    </div>
  )
}
