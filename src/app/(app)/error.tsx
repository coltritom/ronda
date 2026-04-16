'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Error boundary para la sección autenticada de la app.
 * Next.js mantiene el layout padre (Sidebar + TabBar) y reemplaza
 * solo el contenido de la ruta que falló con este componente.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Ronda] App error:', error)
  }, [error])

  const router = useRouter()

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      {/* Ícono decorativo */}
      <div className="relative mb-6 h-20 w-20">
        <div className="absolute inset-0 rounded-full border border-fuego/20" />
        <div className="absolute inset-2 rounded-full border border-fuego/15" />
        <div className="absolute inset-4 rounded-full border border-fuego/10" />
        <div className="absolute inset-0 flex items-center justify-center text-3xl">
          ⚡
        </div>
      </div>

      <h2 className="font-heading text-lg font-bold text-humo mb-2">
        Algo salió mal
      </h2>
      <p className="font-body text-sm text-niebla leading-relaxed mb-8 max-w-[260px]">
        Hubo un error cargando esta pantalla. Podés intentar de nuevo o volver al inicio.
      </p>

      <div className="flex w-full max-w-xs flex-col gap-3">
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
          Ir al inicio
        </button>
      </div>
    </div>
  )
}
