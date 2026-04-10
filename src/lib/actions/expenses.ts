'use server'

import { createClient } from '@/lib/supabase/server'

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

  const splitAmount = parseFloat((amount / splitUserIds.length).toFixed(2))

  const { data: expense, error: expenseError } = await supabase
    .from('expenses')
    .insert({ event_id: eventId, paid_by: paidBy, amount, description, split_type: splitType })
    .select('id')
    .single()

  if (expenseError || !expense) {
    console.error('Error creating expense:', expenseError?.message)
    return { error: 'No se pudo agregar el gasto.' }
  }

  const { error: splitsError } = await supabase
    .from('expense_splits')
    .insert(splitUserIds.map((uid) => ({
      expense_id: expense.id,
      user_id: uid,
      amount: splitAmount,
      is_settled: false,
    })))

  if (splitsError) {
    console.error('Error creating splits:', JSON.stringify(splitsError))
    return { error: 'Gasto creado pero no se pudieron registrar las divisiones.' }
  }

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

  const { error } = await supabase
    .from('settlements')
    .insert({ group_id: groupId, event_id: eventId, from_user: user.id, to_user: toUserId, amount })

  if (error) {
    console.error('Error settling debt:', error.message)
    return { error: 'No se pudo registrar el pago.' }
  }

  return null
}

export async function deleteExpense(
  expenseId: string
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado.' }

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId)

  if (error) {
    console.error('Error deleting expense:', error.message)
    return { error: 'No se pudo eliminar el gasto.' }
  }

  return null
}
