'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

async function assertAdmin(
  supabase: SupabaseServerClient,
  groupId: string,
  userId: string
): Promise<{ error: string } | null> {
  const { data: membership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single()
  return membership?.role === 'admin' ? null : { error: 'Sin permisos.' }
}

export async function createGroup(
  name: string,
  description: string | null,
  emoji?: string
): Promise<{ groupId: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado.' }

  const groupId = crypto.randomUUID()

  const { error: groupError } = await supabase
    .from('groups')
    .insert({ id: groupId, name, description, created_by: user.id, ...(emoji ? { emoji } : {}) })

  if (groupError) {
    console.error('Error creating group:', groupError.message)
    return { error: 'No se pudo crear el grupo. Intentá de nuevo.' }
  }

  const { error: memberError } = await supabase
    .from('group_members')
    .insert({ group_id: groupId, user_id: user.id, role: 'admin' })

  if (memberError) {
    console.error('Error adding member:', memberError.message)
    return { error: 'No se pudo crear el grupo. Intentá de nuevo.' }
  }

  revalidatePath('/groups')
  return { groupId }
}

export async function removeMember(
  groupId: string,
  targetUserId: string
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado.' }

  const { data: errorMsg, error } = await supabase
    .rpc('remove_group_member', {
      p_group_id:  groupId,
      p_actor_id:  user.id,
      p_target_id: targetUserId,
    })

  if (error) {
    console.error('Error removing member:', error.message)
    return { error: 'No se pudo remover al miembro.' }
  }

  if (errorMsg) return { error: errorMsg }

  revalidatePath(`/groups/${groupId}`)
  return null
}

export async function updateGroup(
  groupId: string,
  name: string,
  description: string | null
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado.' }

  const { data: membership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()
  if (!membership) return { error: 'Sin permisos.' }

  const { error } = await supabase
    .from('groups')
    .update({ name, description })
    .eq('id', groupId)

  if (error) {
    console.error('Error updating group:', error.message)
    return { error: 'No se pudo actualizar el grupo.' }
  }

  revalidatePath(`/groups/${groupId}`, 'layout')
  return null
}

export async function promoteToAdmin(
  groupId: string,
  targetUserId: string
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const permError = await assertAdmin(supabase, groupId, user.id)
  if (permError) return permError

  const { createAdminClient } = await import('@/lib/supabase/server')
  const admin = createAdminClient()
  const { error } = await admin
    .from('group_members')
    .update({ role: 'admin' })
    .eq('group_id', groupId)
    .eq('user_id', targetUserId)

  if (error) {
    console.error('Error promoting member:', error.message)
    return { error: 'No se pudo promover al miembro.' }
  }

  revalidatePath(`/groups/${groupId}/settings`)
  return null
}

export async function deleteGroup(groupId: string): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado.' }

  const permError = await assertAdmin(supabase, groupId, user.id)
  if (permError) return permError

  const { error } = await supabase
    .from('groups')
    .delete()
    .eq('id', groupId)

  if (error) {
    console.error('Error deleting group:', error.message)
    return { error: 'No se pudo eliminar el grupo.' }
  }

  redirect('/groups')
}
