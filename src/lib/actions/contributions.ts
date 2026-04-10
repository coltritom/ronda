'use server'

import { createClient } from '@/lib/supabase/server'

type Category = 'bebida' | 'comida' | 'postre' | 'hielo' | 'snacks' | 'juegos' | 'utensilios' | 'otros'

export async function createContribution(
  eventId: string,
  category: Category,
  description: string | null,
  quantity: number,
  forUserId: string
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado.' }

  const { error } = await supabase
    .from('contributions')
    .insert({ event_id: eventId, user_id: forUserId, category, description, quantity })

  if (error) {
    console.error('Error creating contribution:', error.message)
    return { error: 'No se pudo agregar el aporte.' }
  }

  return null
}

export async function deleteContribution(
  contributionId: string
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado.' }

  const { error } = await supabase
    .from('contributions')
    .delete()
    .eq('id', contributionId)

  if (error) {
    console.error('Error deleting contribution:', error.message)
    return { error: 'No se pudo eliminar el aporte.' }
  }

  return null
}
