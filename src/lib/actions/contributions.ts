'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { assertGroupMember } from '@/lib/supabase/auth-utils'
import type { AporteId } from '@/lib/constants'

export async function createContribution(
  eventId: string,
  category: AporteId,
  description: string | null,
  quantity: number,
  guestName?: string,
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado.' }

  const { data: ev } = await supabase.from('events').select('group_id').eq('id', eventId).single()
  if (!ev) return { error: 'Juntada no encontrada.' }

  const memberError = await assertGroupMember(supabase, ev.group_id, user.id)
  if (memberError) return memberError

  const row = guestName
    ? { event_id: eventId, user_id: null,    guest_name: guestName, category, description, quantity }
    : { event_id: eventId, user_id: user.id, guest_name: null,      category, description, quantity }

  const { error } = await supabase
    .from('contributions')
    .insert(row)

  if (error) {
    console.error('Error creating contribution:', error.message)
    return { error: 'No se pudo agregar el aporte.' }
  }

  revalidatePath(`/groups/${ev.group_id}/events/${eventId}`)
  return null
}

export async function updateContribution(
  contributionId: string,
  category: AporteId,
  description: string | null,
  quantity: number,
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  type ContributionWithEvent = { event_id: string; user_id: string; events: { group_id: string } | null }
  const result = await supabase
    .from('contributions')
    .select('event_id, user_id, events ( group_id )')
    .eq('id', contributionId)
    .maybeSingle()
  const contribData = result.data as ContributionWithEvent | null

  if (!contribData) return { error: 'Aporte no encontrado.' }
  if (contribData.user_id !== user.id) return { error: 'Solo podés editar tus propios aportes.' }

  const groupId = contribData.events?.group_id
  if (!groupId) return { error: 'No se pudo verificar el grupo.' }

  const memberError = await assertGroupMember(supabase, groupId, user.id)
  if (memberError) return memberError

  const { error } = await supabase
    .from('contributions')
    .update({ category, description, quantity })
    .eq('id', contributionId)

  if (error) {
    console.error('Error updating contribution:', error.message)
    return { error: 'No se pudo actualizar el aporte.' }
  }

  revalidatePath(`/groups/${groupId}/events/${contribData.event_id}`)
  return null
}

export async function deleteContribution(
  contributionId: string
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado.' }

  /* Resolver el group_id a través de contributions → events */
  type ContributionWithEvent = { event_id: string; events: { group_id: string } | null }
  const result = await supabase
    .from('contributions')
    .select('event_id, events ( group_id )')
    .eq('id', contributionId)
    .maybeSingle()
  const contribData = result.data as ContributionWithEvent | null

  if (!contribData) return { error: 'Aporte no encontrado.' }

  const groupId = contribData.events?.group_id
  if (!groupId) return { error: 'No se pudo verificar el grupo.' }

  const memberError = await assertGroupMember(supabase, groupId, user.id)
  if (memberError) return memberError

  const { error } = await supabase
    .from('contributions')
    .delete()
    .eq('id', contributionId)

  if (error) {
    console.error('Error deleting contribution:', error.message)
    return { error: 'No se pudo eliminar el aporte.' }
  }

  revalidatePath(`/groups/${groupId}/events/${contribData.event_id}`)

  return null
}
