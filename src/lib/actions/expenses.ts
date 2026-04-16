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
  if (splitUserIds.length === 0) return { error: 'Debe haber al menos un participante.' }

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

  const { data: ev } = await supabase.from('events').select('group_id').eq('id', eventId).single()
  if (ev) revalidatePath(`/groups/${ev.group_id}/events/${eventId}`)

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

export async function deleteExpense(
  expenseId: string
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado.' }

  /* Resolver el group_id a través de expenses → events */
  const { data: expenseData } = await supabase
    .from('expenses')
    .select('event_id, events ( group_id )')
    .eq('id', expenseId)
    .maybeSingle()

  if (!expenseData) return { error: 'Gasto no encontrado.' }

  const groupId = (expenseData.events as unknown as { group_id: string } | null)?.group_id
  if (!groupId) return { error: 'No se pudo verificar el grupo.' }

  const memberError = await assertGroupMember(supabase, groupId, user.id)
  if (memberError) return memberError

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId)

  if (error) {
    console.error('Error deleting expense:', error.message)
    return { error: 'No se pudo eliminar el gasto.' }
  }

  revalidatePath(`/groups/${groupId}/events/${expenseData.event_id}`)
  return null
}
