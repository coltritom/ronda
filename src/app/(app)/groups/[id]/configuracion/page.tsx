import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GroupSettingsForm } from '@/components/groups/GroupSettingsForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ConfiguracionPage({ params }: PageProps) {
  const { id: groupId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: membership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user!.id)
    .single()

  if (!membership) notFound()
  if (membership.role !== 'admin') notFound()

  const { data: group } = await supabase
    .from('groups')
    .select('id, name, description')
    .eq('id', groupId)
    .single()

  if (!group) notFound()

  return (
    <div className="flex-1 p-6 lg:p-8">
      <div className="max-w-lg">
        <h2 className="font-heading mb-1 text-lg font-semibold text-humo">
          Configuración del grupo
        </h2>
        <p className="mb-8 text-sm text-niebla">
          Solo los admins pueden modificar esto.
        </p>

        <GroupSettingsForm
          groupId={group.id}
          initialName={group.name}
          initialDescription={group.description ?? ''}
        />
      </div>
    </div>
  )
}
