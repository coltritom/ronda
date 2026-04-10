'use client'

/*
  Página de registro.

  Flujo:
  1. Usuario completa nombre, email y contraseña
  2. Llamamos a Supabase → signUp
  3. Supabase envía un email de confirmación
  4. Mostramos un mensaje pidiendo que confirme el email
  5. Una vez confirmado, Supabase redirige a /auth/callback
     que luego redirige a /groups

  Nota: el trigger en Supabase crea el perfil en la tabla `profiles`
  automáticamente cuando se crea un nuevo usuario, pasando el nombre
  como metadata.
*/
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/clients'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [success, setSuccess]         = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        /*
          emailRedirectTo: a dónde redirige Supabase después de que
          el usuario hace clic en el link de confirmación de email.
          Nuestro route handler /auth/callback gestiona ese redirect.
        */
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          display_name: displayName.trim(),
        },
      },
    })

    if (error) {
      const msg =
        error.message === 'User already registered'
          ? 'Ya existe una cuenta con ese email.'
          : 'Algo salió mal. Intentá de nuevo.'
      setError(msg)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  // Estado de éxito: pedimos que confirmen el email
  if (success) {
    return (
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
              <rect width="20" height="16" x="2" y="4" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
          </div>
          <h2 className="font-heading text-xl font-bold text-foreground">
            Revisá tu email
          </h2>
          <p className="mt-2 text-sm text-muted">
            Te enviamos un link de confirmación a{' '}
            <span className="font-medium text-foreground">{email}</span>.
            Hacé clic en el link para activar tu cuenta.
          </p>
          <p className="mt-4 text-xs text-muted">
            ¿No llegó? Revisá la carpeta de spam.
          </p>
        </div>
        <p className="mt-4 text-center text-sm text-muted">
          <Link
            href="/login"
            className="font-medium text-accent hover:text-accent-hover transition-colors"
          >
            Volver al login
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Creá tu cuenta
          </h1>
          <p className="mt-1 text-sm text-muted">
            Gratis para siempre con tu grupo de amigos
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="¿Cómo te llaman?"
            type="text"
            placeholder="Tu nombre o apodo"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            autoFocus
            autoComplete="name"
          />

          <Input
            label="Email"
            type="email"
            placeholder="vos@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <Input
            label="Contraseña"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3.5 py-2.5">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            loading={loading}
            className="mt-2 w-full"
          >
            Crear cuenta
          </Button>
        </form>
      </div>

      <p className="mt-4 text-center text-sm text-muted">
        ¿Ya tenés cuenta?{' '}
        <Link
          href="/login"
          className="font-medium text-accent hover:text-accent-hover transition-colors"
        >
          Iniciá sesión
        </Link>
      </p>
    </div>
  )
}
