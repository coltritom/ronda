'use client'

/*
  Botón de cerrar sesión. Necesita ser Client Component porque
  usa el cliente de Supabase del browser y el router de Next.js.
*/
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/clients'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="
        flex w-full items-center gap-3 rounded-lg px-3 py-2
        text-sm font-medium text-muted
        hover:text-foreground hover:bg-surface-2
        transition-colors duration-150
      "
    >
      {/* Ícono de salida */}
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
      Cerrar sesión
    </button>
  )
}
