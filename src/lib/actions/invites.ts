'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function getOrCreateInvite(
  groupId: string
): Promise<{ token: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const { data: membership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) return { error: 'No tenés acceso a este grupo.' }

  const admin = createAdminClient()

  /* ¿Ya existe un invite para este grupo? */
  const { data: existing } = await admin
    .from('invites')
    .select('token')
    .eq('group_id', groupId)
    .limit(1)
    .maybeSingle()

  if (existing?.token) return { token: existing.token }

  /* Obtener el nombre del grupo */
  const { data: group } = await admin
    .from('groups')
    .select('name')
    .eq('id', groupId)
    .single()

  if (!group) return { error: 'Grupo no encontrado.' }

  /* Crear el invite */
  const { data, error } = await admin
    .from('invites')
    .insert({ group_id: groupId, created_by: user.id, group_name: group.name })
    .select('token')
    .single()

  if (error || !data) {
    console.error('Error creating invite:', error?.message)
    return { error: 'No se pudo generar el link.' }
  }

  return { token: data.token }
}

export async function getInviteData(
  token: string
): Promise<{ groupId: string; groupName: string; groupEmoji: string; memberCount: number; invitedBy: string } | { error: string }> {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('invites')
    .select('group_id, created_by')
    .eq('token', token)
    .single()

  if (error || !data) {
    console.error('getInviteData error:', error?.message, error?.code)
    return { error: 'Invitación inválida o expirada.' }
  }

  const [countRes, profileRes, groupRes] = await Promise.all([
    admin.from('group_members').select('*', { count: 'exact', head: true }).eq('group_id', data.group_id),
    admin.from('profiles').select('name').eq('id', data.created_by).maybeSingle(),
    admin.from('groups').select('name, emoji').eq('id', data.group_id).single(),
  ])

  const g = groupRes.data as { name: string; emoji?: string } | null
  return {
    groupId: data.group_id,
    groupName: g?.name ?? '',
    groupEmoji: g?.emoji ?? '',
    memberCount: countRes.count ?? 0,
    invitedBy: profileRes.data?.name ?? 'Alguien',
  }
}

export async function acceptInvite(
  token: string
): Promise<{ groupId: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const admin = createAdminClient()

  /* Buscar el invite */
  const { data: invite } = await admin
    .from('invites')
    .select('group_id')
    .eq('token', token)
    .single()

  if (!invite) return { error: 'Invitación inválida o expirada.' }

  /* ¿Ya es miembro? */
  const { data: existing } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', invite.group_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) return { groupId: invite.group_id }

  /* Unirse al grupo */
  const { error } = await supabase
    .from('group_members')
    .insert({ group_id: invite.group_id, user_id: user.id, role: 'member' })

  if (error) {
    console.error('Error joining group:', error.message)
    return { error: 'No se pudo unir al grupo.' }
  }

  return { groupId: invite.group_id }
}
