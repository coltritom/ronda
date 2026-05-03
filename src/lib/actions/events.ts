'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { assertGroupMember } from '@/lib/supabase/auth-utils'

export async function createEvent(
  groupId: string,
  name: string,
  date: string,
  location: string | null,
  description: string | null
): Promise<{ eventId: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado.' }

  const memberError = await assertGroupMember(supabase, groupId, user.id)
  if (memberError) return memberError

  const { data: event, error } = await supabase
    .from('events')
    .insert({
      group_id:    groupId,
      name,
      date:        new Date(date).toISOString(),
      location,
      description,
      status:      'upcoming',
      created_by:  user.id,
    })
    .select('id')
    .single()

  if (error || !event) {
    console.error('Error creating event:', error?.message)
    return { error: 'No se pudo crear la juntada. Intentá de nuevo.' }
  }

  revalidatePath(`/groups/${groupId}`)
  return { eventId: event.id }
}

export async function markAttendance(
  eventId: string,
  attended: boolean
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado.' }

  if (attended) {
    const { error } = await supabase
      .from('event_attendance')
      .upsert(
        { event_id: eventId, user_id: user.id },
        { onConflict: 'event_id,user_id' }
      )
    if (error) {
      console.error('Error marking attendance:', error.message)
      return { error: 'No se pudo registrar la asistencia.' }
    }
  } else {
    const { error } = await supabase
      .from('event_attendance')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', user.id)
    if (error) {
      console.error('Error removing attendance:', error.message)
      return { error: 'No se pudo actualizar la asistencia.' }
    }
  }

  const { data: ev } = await supabase.from('events').select('group_id').eq('id', eventId).single()
  if (ev) revalidatePath(`/groups/${ev.group_id}/events/${eventId}`)

  return null
}

export async function addEventGuest(
  eventId: string,
  name: string
): Promise<{ guest: { id: string; name: string } } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const { data: ev } = await supabase.from('events').select('group_id').eq('id', eventId).single()
  if (!ev) return { error: 'Juntada no encontrada.' }

  const memberError = await assertGroupMember(supabase, ev.group_id, user.id)
  if (memberError) return memberError

  const { data: guest, error } = await supabase
    .from('event_guests')
    .insert({ event_id: eventId, name: name.trim() })
    .select('id, name')
    .single()

  if (error || !guest) return { error: 'No se pudo agregar el invitado.' }

  revalidatePath(`/groups/${ev.group_id}/events/${eventId}`)
  return { guest }
}

export async function removeEventGuest(
  guestId: string,
  eventId: string
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const { data: ev } = await supabase.from('events').select('group_id').eq('id', eventId).single()
  if (!ev) return { error: 'Juntada no encontrada.' }

  const memberError = await assertGroupMember(supabase, ev.group_id, user.id)
  if (memberError) return memberError

  const { error } = await supabase
    .from('event_guests')
    .delete()
    .eq('id', guestId)
    .eq('event_id', eventId)

  if (error) return { error: 'No se pudo eliminar el invitado.' }

  revalidatePath(`/groups/${ev.group_id}/events/${eventId}`)
  return null
}

export async function upsertRsvp(
  eventId: string,
  status: 'going' | 'maybe' | 'not_going'
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado.' }

  const { error } = await supabase
    .from('event_rsvps')
    .upsert(
      { event_id: eventId, user_id: user.id, response: status },
      { onConflict: 'event_id,user_id' }
    )

  if (error) {
    console.error('Error saving RSVP:', error.message)
    return { error: 'No se pudo guardar tu respuesta.' }
  }

  const { data: ev } = await supabase.from('events').select('group_id').eq('id', eventId).single()
  if (ev) revalidatePath(`/groups/${ev.group_id}/events/${eventId}`)

  return null
}
