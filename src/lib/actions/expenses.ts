'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { assertGroupMember } from '@/lib/supabase/auth-utils'

export async function createExpense(
  eventId: string,
  description: string | null,
  amount: number,
  paidBy: string,
  splitType: 'equal_all' | 'equal_some',
  splitUserIds: string[]
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado.' }

  if (amount <= 0) return { error: 'El monto debe ser mayor a cero.' }
  if (amount > 100_000_000) return { error: 'El monto no puede superar $100.000.000.' }
  if (splitUserIds.length === 0) return { error: 'Debe haber al menos un participante.' }

  const { data: ev } = await supabase.from('events').select('group_id').eq('id', eventId).single()
  if (!ev) return { error: 'Evento no encontrado.' }

  const memberError = await assertGroupMember(supabase, ev.group_id, user.id)
  if (memberError) return memberError

  const { data: expenseId, error } = await supabase
    .rpc('create_expense_with_splits', {
      p_event_id:       eventId,
      p_description:    description,
      p_amount:         amount,
      p_paid_by:        paidBy,
      p_split_type:     splitType,
      p_split_user_ids: splitUserIds,
    })

  if (error || !expenseId) {
    console.error('Error creating expense:', error?.message)
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
  paidBy: string,
  splitType: 'equal_all' | 'equal_some',
  splitUserIds: string[]
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado.' }
  if (amount <= 0) return { error: 'El monto debe ser mayor a cero.' }
  if (amount > 100_000_000) return { error: 'El monto no puede superar $100.000.000.' }
  if (splitUserIds.length === 0) return { error: 'Debe haber al menos un participante.' }

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

  if (expenseData.paid_by !== user.id) return { error: 'Solo quien pagó puede editar este gasto.' }

  const n = splitUserIds.length
  const perPerson = Math.round((amount / n) * 100) / 100
  const newSplits = splitUserIds.map((uid, i) => ({
    expense_id: expenseId,
    user_id: uid,
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
    .update({ description, amount, paid_by: paidBy, split_type: splitType })
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
