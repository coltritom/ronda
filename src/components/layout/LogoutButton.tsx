'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
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
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 font-body text-sm font-medium text-niebla hover:text-error hover:bg-error/10 transition-colors duration-150"
    >
      <LogOut size={16} />
      Cerrar sesión
    </button>
  )
}
