import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RemoveMemberButton } from '@/components/groups/RemoveMemberButton'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MiembrosPage({ params }: PageProps) {
  const { id: groupId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: myMembership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user!.id)
    .single()

  if (!myMembership) notFound()

  const isAdmin = myMembership.role === 'admin'

  const { data: membersRaw } = await supabase
    .from('group_members')
    .select('user_id, role')
    .eq('group_id', groupId)

  const memberUserIds = (membersRaw ?? []).map(m => m.user_id)
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', memberUserIds)
  const profileMap = Object.fromEntries((profilesData ?? []).map(p => [p.id, p.name]))

  const members = (membersRaw ?? []).map((m) => ({
    userId: m.user_id,
    role:   m.role as 'admin' | 'member',
    name:   profileMap[m.user_id] ?? 'Usuario',
  }))

  return (
    <div className="flex-1 p-6 lg:p-8">
      <div className="max-w-2xl">
        <h2 className="font-heading mb-1 text-lg font-semibold text-humo">
          Miembros
        </h2>
        <p className="mb-6 text-sm text-niebla">
          {members.length} {members.length === 1 ? 'persona' : 'personas'} en el grupo.
        </p>

        <div className="flex flex-col gap-3">
          {members.map((m) => (
            <div
              key={m.userId}
              className={`flex items-center gap-4 rounded-2xl border px-5 py-4 ${
                m.userId === user!.id
                  ? 'border-accent/30 bg-accent/5'
                  : 'bg-noche-media'
              }`}
            >
              {/* Avatar */}
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-noche text-sm font-bold text-humo">
                {m.name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-humo">
                    {m.userId === user!.id ? 'Yo' : m.name}
                  </p>
                  {m.role === 'admin' && (
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                      Admin
                    </span>
                  )}
                </div>
              </div>

              {/* Acción — admin puede remover a cualquiera; cualquiera puede salir */}
              {(isAdmin || m.userId === user!.id) && (
                <RemoveMemberButton
                  groupId={groupId}
                  userId={m.userId}
                  name={m.name}
                  isSelf={m.userId === user!.id}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
