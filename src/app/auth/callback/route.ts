/*
  Route Handler del callback de Supabase.

  ¿Cuándo se llama esto?
  - Cuando el usuario hace clic en el link de confirmación de email
  - Cuando el usuario hace clic en el link de recupero de contraseña
  - En cualquier flujo OAuth (Google, etc.) si lo agregamos después

  Supabase redirige al usuario a /auth/callback?code=XXXX
  Este handler intercambia ese código por una sesión activa.

  Es un Route Handler (no una página), por eso el archivo se llama
  route.ts en vez de page.tsx.
*/
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // `next` permite redirigir a una ruta específica después del callback
  const next = searchParams.get('next') ?? '/groups'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Si algo falla, mandamos al login con un mensaje de error
  return NextResponse.redirect(`${origin}/login?error=link_invalido`)
}
