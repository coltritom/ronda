'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Ronda] Unhandled error:', error)
  }, [error])

  const router = useRouter()

  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-noche flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          {/* Logo */}
          <span className="font-display font-extrabold text-2xl text-fuego tracking-tight">
            ronda
          </span>

          {/* Ícono */}
          <div className="relative my-8 mx-auto h-20 w-20">
            <div className="absolute inset-0 rounded-full border border-fuego/20" />
            <div className="absolute inset-2 rounded-full border border-fuego/15" />
            <div className="absolute inset-4 rounded-full border border-fuego/10" />
            <div className="absolute inset-0 flex items-center justify-center text-3xl">
              ⚡
            </div>
          </div>

          <h1 className="font-heading text-xl font-bold text-humo mb-2">
            Algo salió mal
          </h1>
          <p className="font-body text-sm text-niebla leading-relaxed mb-8 max-w-[260px] mx-auto">
            Hubo un error inesperado. No perdiste tus datos — podés intentar de nuevo o volver al inicio.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={reset}
              className="
                w-full py-3 rounded-xl font-semibold text-[15px]
                bg-fuego text-white
                hover:bg-fuego/90 active:scale-[0.98] transition-all
              "
            >
              Intentar de nuevo
            </button>
            <button
              onClick={() => router.push('/home')}
              className="
                w-full py-3 rounded-xl font-semibold text-[15px]
                bg-white/[0.06] text-niebla border border-white/[0.08]
                hover:bg-white/10 active:scale-[0.98] transition-all
              "
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
