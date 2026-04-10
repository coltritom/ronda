'use client'

/*
  Página de recupero de contraseña.

  Flujo:
  1. Usuario ingresa su email
  2. Llamamos a Supabase → resetPasswordForEmail
  3. Supabase envía un email con un link para resetear
  4. El link lleva a /auth/callback?type=recovery, que redirige
     a una futura página /update-password donde el usuario elige
     su nueva contraseña (lo haremos más adelante)
*/
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/clients'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [sent, setSent]       = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
    })

    if (error) {
      setError('No pudimos enviar el email. Intentá de nuevo.')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <path d="m9 11 3 3L22 4"/>
            </svg>
          </div>
          <h2 className="font-heading text-xl font-bold text-foreground">
            Email enviado
          </h2>
          <p className="mt-2 text-sm text-muted">
            Si{' '}
            <span className="font-medium text-foreground">{email}</span>{' '}
            tiene una cuenta, vas a recibir un link para resetear tu contraseña.
          </p>
          <p className="mt-4 text-xs text-muted">
            El link expira en 1 hora. Revisá también spam.
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
            Recuperar contraseña
          </h1>
          <p className="mt-1 text-sm text-muted">
            Te mandamos un link para crear una nueva
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email de tu cuenta"
            type="email"
            placeholder="vos@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            autoComplete="email"
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
            Enviar link de recupero
          </Button>
        </form>
      </div>

      <p className="mt-4 text-center text-sm text-muted">
        <Link
          href="/login"
          className="font-medium text-accent hover:text-accent-hover transition-colors"
        >
          ← Volver al login
        </Link>
      </p>
    </div>
  )
}
