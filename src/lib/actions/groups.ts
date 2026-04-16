'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createGroup(
  name: string,
  description: string | null
): Promise<{ groupId: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado.' }

  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({ name, description, created_by: user.id })
    .select('id')
    .single()

  if (groupError || !group) {
    console.error('Error creating group:', groupError?.message)
    return { error: 'No se pudo crear el grupo. Intentá de nuevo.' }
  }

  const { error: memberError } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: user.id, role: 'admin' })

  if (memberError) {
    console.error('Error adding member:', memberError.message)
  }

  revalidatePath('/groups')
  return { groupId: group.id }
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

  if (membership?.role !== 'admin') return { error: 'Sin permisos.' }

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

export async function deleteGroup(groupId: string): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado.' }

  const { data: membership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (membership?.role !== 'admin') return { error: 'Sin permisos.' }

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
