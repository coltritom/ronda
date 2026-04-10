'use server'

import { createClient } from '@/lib/supabase/server'

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

  return null
}
