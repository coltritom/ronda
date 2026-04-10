'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateProfile(
  name: string
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado.' }
  if (!name.trim()) return { error: 'El nombre no puede estar vacío.' }

  const { error } = await supabase
    .from('profiles')
    .update({ name: name.trim() })
    .eq('id', user.id)

  if (error) {
    console.error('Error updating profile:', error.message)
    return { error: 'No se pudo actualizar el perfil.' }
  }

  revalidatePath('/', 'layout')
  return null
}
