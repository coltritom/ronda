import { createClient } from '@/lib/supabase/server'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

/**
 * Verifica que userId sea miembro activo de groupId.
 * Retorna null si la verificación pasa, o { error } si no.
 */
export async function assertGroupMember(
  supabase: SupabaseServerClient,
  groupId: string,
  userId: string
): Promise<{ error: string } | null> {
  const { data } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle()

  if (!data) return { error: 'No tenés acceso a este grupo.' }
  return null
}
