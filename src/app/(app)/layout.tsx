/*
  Layout principal de la app autenticada.

  Este es un Server Component: puede hacer llamadas a Supabase
  directamente, sin necesidad de "use client".

  ¿Por qué otro layout además del raíz?
  - El layout raíz (src/app/layout.tsx) aplica a TODA la app
    (incluyendo auth pages).
  - Este layout aplica solo a las páginas de la app (groups, events, etc.)
    y agrega la sidebar de navegación.

  El (app) con paréntesis es otra Route Group: agrupa las páginas
  de la app sin afectar las URLs.
*/
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Verificación de sesión — respaldo al middleware
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Traemos el perfil del usuario (nombre, avatar)
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, avatar_url')
    .eq('id', user.id)
    .single()

  const displayName =
    profile?.name ??
    user.email?.split('@')[0] ??
    'Usuario'

  return (
    /*
      flex en la raíz:
      - Sidebar ocupa su ancho fijo (w-60 en desktop)
      - main ocupa el resto (flex-1)
    */
    <div className="flex min-h-screen bg-background">
      <Sidebar
        user={{
          email:      user.email ?? '',
          displayName,
          avatarUrl:  profile?.avatar_url ?? null,
        }}
      />

      {/*
        pt-14 en mobile: compensa el header fijo de 56px (h-14)
        En desktop (lg:) no hace falta porque la sidebar es estática
      */}
      <main className="flex-1 overflow-y-auto pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  )
}
