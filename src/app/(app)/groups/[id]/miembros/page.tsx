import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
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
    <div className="max-w-2xl mx-auto pb-8">
      <div className="px-4 md:px-6 pt-4 pb-2">
        <Link
          href={`/groups/${groupId}`}
          className="flex items-center gap-1 text-fuego text-[13px] font-semibold mb-3"
        >
          <ChevronLeft size={16} />
          Grupo
        </Link>
        <h1 className="font-display font-bold text-[22px] text-humo">Miembros</h1>
        <p className="text-sm text-niebla mt-1">
          {members.length} {members.length === 1 ? 'persona' : 'personas'} en el grupo.
        </p>
      </div>

      <div className="px-4 md:px-6 mt-4 flex flex-col gap-3">
        {members.map((m) => (
          <div
            key={m.userId}
            className={`flex items-center gap-4 rounded-2xl px-4 py-3.5 ${
              m.userId === user!.id
                ? 'bg-fuego/[0.06] ring-1 ring-fuego/20'
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
                    <span className="rounded-full bg-fuego/[0.12] px-2 py-0.5 text-xs font-semibold text-fuego">
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
  )
}
