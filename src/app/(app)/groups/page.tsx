/*
  Página de grupos — Server Component.

  Fetchea los grupos del usuario directamente desde Supabase en el servidor.
  El botón "Nuevo grupo" es un Client Component separado (CreateGroupModal)
  que gestiona su propio estado. Después de crear, llama a router.refresh()
  y este Server Component vuelve a ejecutarse con los datos actualizados.
*/
import { createClient } from '@/lib/supabase/server'
import type { GroupWithMeta } from '@/types'
import { GroupCard } from '@/components/groups/GroupCard'
import { CreateGroupModal } from '@/components/groups/CreateGroupModal'

export default async function GroupsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  /*
    Traemos los grupos del usuario via la tabla pivote group_members.
    La relación es: group_members → groups
    También pedimos el conteo de miembros de cada grupo.
  */
  const { data: memberships, error } = await supabase
    .from('group_members')
    .select(`
      role,
      groups (
        id, name, description, created_by, created_at,
        group_members ( count )
      )
    `)
    .eq('user_id', user!.id)
    .order('created_at', { referencedTable: 'groups', ascending: false })

  if (error) console.error('Error fetching groups:', error.message)

  /* Transformamos la respuesta a la forma GroupWithMeta[] */
  const groups: GroupWithMeta[] = (memberships ?? [])
    .filter((m) => m.groups !== null)
    .map((m) => {
      const g = m.groups as NonNullable<typeof m.groups>
      /* Supabase devuelve el count como: [{ count: N }] */
      const memberCount = Array.isArray(g.group_members)
        ? (g.group_members[0] as { count: number })?.count ?? 0
        : 0

      return {
        id:           g.id,
        name:         g.name,
        description:  g.description,
        emoji:        null,
        created_by:   g.created_by,
        created_at:   g.created_at,
        role:         m.role as 'admin' | 'member',
        member_count: memberCount,
      }
    })

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground lg:text-3xl">
            Mis grupos
          </h1>
          <p className="mt-1 text-sm text-muted">
            {groups.length === 0
              ? 'Creá tu primer grupo para empezar'
              : `${groups.length} ${groups.length === 1 ? 'grupo' : 'grupos'}`
            }
          </p>
        </div>

        <CreateGroupModal />
      </div>

      {/* Lista de grupos o estado vacío */}
      {groups.length > 0 ? (
        <div className="flex flex-col gap-3">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface py-20 text-center px-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-2 mb-4 text-3xl">
            👥
          </div>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Todavía no tenés grupos
          </h2>
          <p className="mt-2 max-w-sm text-sm text-muted">
            Creá un grupo, sumá a tus amigos con un link y empezá
            a trackear juntadas, gastos y quién siempre llega tarde.
          </p>
        </div>
      )}
    </div>
  )
}
