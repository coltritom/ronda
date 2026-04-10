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

  return { groupId: group.id }
}

export async function removeMember(
  groupId: string,
  targetUserId: string
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado.' }

  /* Verificar que quien ejecuta es admin */
  const { data: membership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (membership?.role !== 'admin') return { error: 'Sin permisos.' }

  /* No permitir remover al único admin */
  if (targetUserId === user.id) {
    const { count } = await supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .eq('role', 'admin')

    if ((count ?? 0) <= 1) return { error: 'No podés removerte si sos el único admin.' }
  }

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', targetUserId)

  if (error) {
    console.error('Error removing member:', error.message)
    return { error: 'No se pudo remover al miembro.' }
  }

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

  revalidatePath(`/groups/${groupId}`)
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
