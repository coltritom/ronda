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
  if (name.length > 100) return { error: 'El nombre no puede superar 100 caracteres.' }
  if (location && location.length > 200) return { error: 'La ubicación no puede superar 200 caracteres.' }
  if (description && description.length > 500) return { error: 'La descripción no puede superar 500 caracteres.' }

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

  const { data: ev } = await supabase.from('events').select('group_id').eq('id', eventId).single()
  if (!ev) return { error: 'Juntada no encontrada.' }

  const memberError = await assertGroupMember(supabase, ev.group_id, user.id)
  if (memberError) return memberError

  // Delete any existing record first (idempotent regardless of unique constraints)
  await supabase
    .from('event_attendance')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', user.id)

  if (attended) {
    const { error } = await supabase
      .from('event_attendance')
      .insert({ event_id: eventId, user_id: user.id })
    if (error) {
      console.error('Error marking attendance:', error.message)
      return { error: 'No se pudo registrar la asistencia.' }
    }
  }

  revalidatePath(`/groups/${ev.group_id}/events/${eventId}`)
  return null
}

export async function addEventGuest(
  eventId: string,
  name: string
): Promise<{ guest: { id: string; name: string } } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const trimmedName = name.trim()
  if (!trimmedName) return { error: 'El nombre del invitado no puede estar vacío.' }
  if (trimmedName.length > 80) return { error: 'El nombre del invitado no puede superar 80 caracteres.' }

  const { data: ev } = await supabase.from('events').select('group_id').eq('id', eventId).single()
  if (!ev) return { error: 'Juntada no encontrada.' }

  const memberError = await assertGroupMember(supabase, ev.group_id, user.id)
  if (memberError) return memberError

  const { data: guest, error } = await supabase
    .from('event_guests')
    .insert({ event_id: eventId, name: trimmedName })
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

export async function updateEvent(
  eventId: string,
  name: string,
  date: string,
  location: string | null,
  description: string | null
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  if (!name.trim()) return { error: 'El nombre es requerido.' }
  if (name.length > 100) return { error: 'El nombre no puede superar 100 caracteres.' }
  if (location && location.length > 200) return { error: 'La ubicación no puede superar 200 caracteres.' }
  if (description && description.length > 500) return { error: 'La descripción no puede superar 500 caracteres.' }

  const { data: ev } = await supabase
    .from('events')
    .select('group_id, created_by')
    .eq('id', eventId)
    .single()
  if (!ev) return { error: 'Juntada no encontrada.' }

  const { data: membership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', ev.group_id)
    .eq('user_id', user.id)
    .single()

  if (membership?.role !== 'admin' && ev.created_by !== user.id)
    return { error: 'No tenés permiso para editar esta juntada.' }

  const { error } = await supabase
    .from('events')
    .update({
      name:        name.trim(),
      date:        new Date(date).toISOString(),
      location:    location?.trim() || null,
      description: description?.trim() || null,
    })
    .eq('id', eventId)

  if (error) {
    console.error('Error updating event:', error.message)
    return { error: 'No se pudo actualizar la juntada.' }
  }

  revalidatePath(`/groups/${ev.group_id}/events/${eventId}`)
  revalidatePath(`/groups/${ev.group_id}`)
  return null
}

export async function deleteEvent(
  eventId: string
): Promise<{ groupId: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const { data: ev } = await supabase
    .from('events')
    .select('group_id, created_by')
    .eq('id', eventId)
    .single()
  if (!ev) return { error: 'Juntada no encontrada.' }

  const { data: membership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', ev.group_id)
    .eq('user_id', user.id)
    .single()

  if (membership?.role !== 'admin' && ev.created_by !== user.id)
    return { error: 'No tenés permiso para eliminar esta juntada.' }

  // Delete expense_splits before expenses (FK constraint)
  const { data: expensesData } = await supabase
    .from('expenses')
    .select('id')
    .eq('event_id', eventId)

  const expenseIds = (expensesData ?? []).map(e => e.id)
  if (expenseIds.length > 0) {
    await supabase.from('expense_splits').delete().in('expense_id', expenseIds)
  }

  await Promise.all([
    supabase.from('settlements').delete().eq('event_id', eventId),
    supabase.from('expenses').delete().eq('event_id', eventId),
    supabase.from('event_attendance').delete().eq('event_id', eventId),
    supabase.from('event_guests').delete().eq('event_id', eventId),
    supabase.from('contributions').delete().eq('event_id', eventId),
    supabase.from('event_rsvps').delete().eq('event_id', eventId),
  ])

  const { error } = await supabase.from('events').delete().eq('id', eventId)
  if (error) {
    console.error('Error deleting event:', error.message)
    return { error: 'No se pudo eliminar la juntada.' }
  }

  revalidatePath(`/groups/${ev.group_id}`)
  return { groupId: ev.group_id }
}

export async function upsertRsvp(
  eventId: string,
  status: 'going' | 'maybe' | 'not_going'
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado.' }

  const { data: ev } = await supabase.from('events').select('group_id').eq('id', eventId).single()
  if (!ev) return { error: 'Juntada no encontrada.' }

  const memberError = await assertGroupMember(supabase, ev.group_id, user.id)
  if (memberError) return memberError

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

  revalidatePath(`/groups/${ev.group_id}/events/${eventId}`)
  return null
}
