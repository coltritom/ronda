'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { assertGroupMember } from '@/lib/supabase/auth-utils'

export type SplitParticipant = { userId?: string; guestName?: string }

export async function createExpense(
  eventId: string,
  description: string | null,
  amount: number,
  paidBy: string | null,
  paidByGuestName: string | null,
  splitType: 'equal_all' | 'equal_some',
  participants: SplitParticipant[]
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado.' }
  if (amount <= 0) return { error: 'El monto debe ser mayor a cero.' }
  if (amount > 100_000_000) return { error: 'El monto no puede superar $100.000.000.' }
  if (participants.length === 0) return { error: 'Debe haber al menos un participante.' }

  const { data: ev } = await supabase.from('events').select('group_id').eq('id', eventId).single()
  if (!ev) return { error: 'Evento no encontrado.' }

  const memberError = await assertGroupMember(supabase, ev.group_id, user.id)
  if (memberError) return memberError

  const { createAdminClient } = await import('@/lib/supabase/server')
  const admin = createAdminClient()

  const { data: expense, error: expErr } = await admin
    .from('expenses')
    .insert({ event_id: eventId, description, amount, paid_by: paidBy, paid_by_guest_name: paidByGuestName, split_type: splitType })
    .select('id')
    .single()

  if (expErr || !expense) {
    console.error('Error creating expense:', expErr?.message)
    return { error: 'No se pudo agregar el gasto.' }
  }

  const n = participants.length
  const perPerson = Math.round((amount / n) * 100) / 100
  const splits = participants.map((p, i) => ({
    expense_id: expense.id,
    user_id:    p.userId   ?? null,
    guest_name: p.guestName ?? null,
    amount: i === n - 1
      ? Math.round((amount - perPerson * (n - 1)) * 100) / 100
      : perPerson,
    is_settled: false,
  }))

  const { error: splitsErr } = await admin.from('expense_splits').insert(splits)
  if (splitsErr) {
    console.error('Error creating splits:', splitsErr.message)
    await admin.from('expenses').delete().eq('id', expense.id)
    return { error: 'No se pudo agregar el gasto.' }
  }

  revalidatePath(`/groups/${ev.group_id}/events/${eventId}`)
  return null
}

export async function settleDebt(
  groupId: string,
  eventId: string,
  toUserId: string,
  amount: number
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado.' }
  if (amount <= 0) return { error: 'El monto debe ser mayor a cero.' }
  if (amount > 100_000_000) return { error: 'El monto no puede superar $100.000.000.' }
  if (user.id === toUserId) return { error: 'No podés saldar una deuda con vos mismo.' }

  const memberError = await assertGroupMember(supabase, groupId, user.id)
  if (memberError) return memberError

  const { error } = await supabase
    .from('settlements')
    .insert({ group_id: groupId, event_id: eventId, from_user: user.id, to_user: toUserId, amount })

  if (error) {
    console.error('Error settling debt:', error.message)
    return { error: 'No se pudo registrar el pago.' }
  }

  revalidatePath(`/groups/${groupId}/events/${eventId}`)
  return null
}

export async function updateExpense(
  expenseId: string,
  description: string | null,
  amount: number,
  paidBy: string | null,
  paidByGuestName: string | null,
  splitType: 'equal_all' | 'equal_some',
  participants: SplitParticipant[]
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado.' }
  if (amount <= 0) return { error: 'El monto debe ser mayor a cero.' }
  if (amount > 100_000_000) return { error: 'El monto no puede superar $100.000.000.' }
  if (participants.length === 0) return { error: 'Debe haber al menos un participante.' }

  const { data: expenseData } = await supabase
    .from('expenses')
    .select('event_id, paid_by')
    .eq('id', expenseId)
    .maybeSingle()
  if (!expenseData) return { error: 'Gasto no encontrado.' }

  const { data: eventData } = await supabase
    .from('events')
    .select('group_id')
    .eq('id', expenseData.event_id)
    .maybeSingle()
  if (!eventData) return { error: 'No se pudo verificar el evento.' }

  const memberError = await assertGroupMember(supabase, eventData.group_id, user.id)
  if (memberError) return memberError

  const n = participants.length
  const perPerson = Math.round((amount / n) * 100) / 100
  const newSplits = participants.map((p, i) => ({
    expense_id: expenseId,
    user_id:    p.userId   ?? null,
    guest_name: p.guestName ?? null,
    amount: i === n - 1
      ? Math.round((amount - perPerson * (n - 1)) * 100) / 100
      : perPerson,
    is_settled: false,
  }))

  const { createAdminClient } = await import('@/lib/supabase/server')
  const admin = createAdminClient()

  const { error: splitsDelErr } = await admin.from('expense_splits').delete().eq('expense_id', expenseId)
  if (splitsDelErr) {
    console.error('Error deleting splits:', splitsDelErr.message)
    return { error: 'No se pudo actualizar el gasto.' }
  }

  const { error: updateError } = await admin
    .from('expenses')
    .update({ description, amount, paid_by: paidBy, paid_by_guest_name: paidByGuestName, split_type: splitType })
    .eq('id', expenseId)
  if (updateError) {
    console.error('Error updating expense:', updateError.message)
    return { error: 'No se pudo actualizar el gasto.' }
  }

  const { error: splitsInsErr } = await admin.from('expense_splits').insert(newSplits)
  if (splitsInsErr) {
    console.error('Error inserting splits:', splitsInsErr.message)
    return { error: 'No se pudo actualizar el gasto.' }
  }

  revalidatePath(`/groups/${eventData.group_id}/events/${expenseData.event_id}`)
  return null
}

export async function deleteExpense(
  expenseId: string
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado.' }

  const { data: expenseData } = await supabase
    .from('expenses')
    .select('event_id, paid_by')
    .eq('id', expenseId)
    .maybeSingle()
  if (!expenseData) return { error: 'Gasto no encontrado.' }

  const { data: eventData } = await supabase
    .from('events')
    .select('group_id')
    .eq('id', expenseData.event_id)
    .maybeSingle()
  if (!eventData) return { error: 'No se pudo verificar el evento.' }

  const memberError = await assertGroupMember(supabase, eventData.group_id, user.id)
  if (memberError) return memberError

  const { createAdminClient } = await import('@/lib/supabase/server')
  const admin = createAdminClient()

  await admin.from('expense_splits').delete().eq('expense_id', expenseId)

  const { error } = await admin.from('expenses').delete().eq('id', expenseId)
  if (error) {
    console.error('Error deleting expense:', error.message)
    return { error: 'No se pudo eliminar el gasto.' }
  }

  revalidatePath(`/groups/${eventData.group_id}/events/${expenseData.event_id}`)
  return null
}
