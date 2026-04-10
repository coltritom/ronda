import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/profile/ProfileForm'

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user!.id)
    .single()

  return (
    <div className="flex-1 p-6 lg:p-8">
      <div className="max-w-lg">
        <h1 className="font-heading mb-1 text-2xl font-bold text-foreground">
          Mi perfil
        </h1>
        <p className="mb-8 text-sm text-muted">
          {user!.email}
        </p>

        <ProfileForm initialName={profile?.name ?? ''} />
      </div>
    </div>
  )
}
