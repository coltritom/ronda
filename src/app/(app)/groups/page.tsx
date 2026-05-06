import { createClient } from '@/lib/supabase/server'
import type { GroupWithMeta } from '@/types'
import { GroupCard } from '@/components/groups/GroupCard'
import { CreateGroupModal } from '@/components/groups/CreateGroupModal'
import { GroupsEmptyState } from '@/components/groups/GroupsEmptyState'

export default async function GroupsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: memberships, error } = await supabase
    .from('group_members')
    .select(`
      role,
      groups (
        id, name, description, emoji, created_by, created_at,
        group_members ( count )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { referencedTable: 'groups', ascending: false })

  if (error) console.error('Error fetching groups:', error.message)

  const groups: GroupWithMeta[] = (memberships ?? [])
    .filter((m) => m.groups != null)
    .map((m) => {
      const g = Array.isArray(m.groups) ? m.groups[0] : m.groups
      const memberCount = Array.isArray(g?.group_members) ? (g.group_members[0]?.count ?? 0) : 0
      return {
        id:           g.id,
        name:         g.name,
        description:  g.description,
        emoji:        g.emoji ?? null,
        created_by:   g.created_by,
        created_at:   g.created_at,
        role:         m.role as 'admin' | 'member',
        member_count: memberCount,
      }
    })

  return (
    <div className="p-5 lg:p-8 max-w-2xl">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-humo lg:text-3xl">
            Mis grupos
          </h1>
          <p className="mt-1 font-body text-sm text-niebla">
            {groups.length === 0
              ? 'Creá tu primer grupo para empezar'
              : `${groups.length} ${groups.length === 1 ? 'grupo' : 'grupos'}`
            }
          </p>
        </div>

        {/* Solo mostrar el botón/FAB del header cuando ya hay grupos.
            Cuando la lista está vacía, el CTA vive dentro de GroupsEmptyState
            para evitar duplicar el FAB en mobile. */}
        {groups.length > 0 && <CreateGroupModal />}
      </div>

      {/* Lista o empty state */}
      {groups.length > 0 ? (
        <div className="flex flex-col gap-3">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      ) : (
        <GroupsEmptyState />
      )}
    </div>
  )
}
