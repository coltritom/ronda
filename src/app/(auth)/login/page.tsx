'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/clients'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      // Traducimos los errores más comunes al español
      const msg =
        error.message === 'Invalid login credentials'
          ? 'Email o contraseña incorrectos.'
          : error.message === 'Email not confirmed'
          ? 'Confirmá tu email antes de iniciar sesión.'
          : 'Algo salió mal. Intentá de nuevo.'
      setError(msg)
      setLoading(false)
      return
    }

    /*
      router.refresh() actualiza el Server Component layout con la nueva sesión.
      router.push lleva al usuario a la app.
    */
    router.refresh()
    router.push(next ?? '/groups')
  }

  return (
    <div className="w-full max-w-sm">
      {/* Card */}
      <div className="rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Bienvenido de vuelta
          </h1>
          <p className="mt-1 text-sm text-muted">
            Ingresá a tu cuenta para continuar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="vos@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoFocus
          />

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground" htmlFor="password">
                Contraseña
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-muted hover:text-accent transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {/* Mensaje de error */}
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
            Iniciar sesión
          </Button>
        </form>
      </div>

      {/* Link a registro */}
      <p className="mt-4 text-center text-sm text-muted">
        ¿No tenés cuenta?{' '}
        <Link
          href="/register"
          className="font-medium text-accent hover:text-accent-hover transition-colors"
        >
          Registrate gratis
        </Link>
      </p>
    </div>
  )
}
