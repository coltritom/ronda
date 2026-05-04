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
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado.' }

  const { error } = await supabase
    .from('contributions')
    .insert({ event_id: eventId, user_id: user.id, category, description, quantity })

  if (error) {
    console.error('Error creating contribution:', error.message)
    return { error: 'No se pudo agregar el aporte.' }
  }

  const { data: ev } = await supabase.from('events').select('group_id').eq('id', eventId).single()
  if (ev) revalidatePath(`/groups/${ev.group_id}/events/${eventId}`)

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
