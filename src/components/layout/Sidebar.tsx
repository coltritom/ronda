'use client'

/*
  Sidebar principal de la app.

  Comportamiento:
  - Desktop (lg+): siempre visible a la izquierda, fijo
  - Mobile: oculto por defecto, se abre como panel lateral con overlay

  Recibe los datos del usuario como props desde el Server Component
  del layout (que los obtiene de Supabase).
*/
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LogoutButton } from '@/components/layout/LogoutButton'

interface SidebarProps {
  user: {
    email: string
    displayName: string
    avatarUrl?: string | null
  }
}

/* ─── Ítem de navegación ─────────────────────────────────────── */
interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  {
    href: '/groups',
    label: 'Mis grupos',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
]

/* ─── Contenido interno del sidebar ─────────────────────────── */
function SidebarContent({
  user,
  onClose,
}: {
  user: SidebarProps['user']
  onClose?: () => void
}) {
  const pathname = usePathname()
  const initial = user.displayName.charAt(0).toUpperCase()

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center justify-between border-b border-border px-4 py-4">
        <Link
          href="/groups"
          onClick={onClose}
          className="flex items-center gap-2.5"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
            <span className="font-heading text-sm font-bold text-white">R</span>
          </div>
          <span className="font-heading text-lg font-bold text-foreground">
            Ronda
          </span>
        </Link>

        {/* Botón cerrar — solo visible en mobile */}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Cerrar menú"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-surface-2 transition-colors lg:hidden"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 rounded-lg px-3 py-2.5
                    text-sm font-medium transition-colors duration-150
                    ${isActive
                      ? 'bg-accent/10 text-accent'
                      : 'text-muted hover:text-foreground hover:bg-surface-2'
                    }
                  `}
                >
                  <span className={isActive ? 'text-accent' : ''}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Usuario + acciones */}
      <div className="border-t border-border px-3 py-3">
        {/* Info del usuario */}
        <div className="flex items-center gap-1 mb-1">
          <Link
            href="/perfil"
            onClick={onClose}
            className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-surface-2 transition-colors"
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
              <span className="text-sm font-semibold">{initial}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {user.displayName}
              </p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
          </Link>
          <ThemeToggle />
        </div>

        <LogoutButton />
      </div>
    </div>
  )
}

/* ─── Sidebar principal ──────────────────────────────────────── */
export function Sidebar({ user }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* ── Desktop: sidebar fijo a la izquierda ── */}
      <aside className="hidden lg:flex w-60 flex-shrink-0 flex-col border-r border-border bg-surface h-screen sticky top-0">
        <SidebarContent user={user} />
      </aside>

      {/* ── Mobile: header con botón hamburguesa ── */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-surface px-4">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menú"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-surface-2 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6"/>
            <line x1="4" y1="12" x2="20" y2="12"/>
            <line x1="4" y1="18" x2="20" y2="18"/>
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent">
            <span className="font-heading text-xs font-bold text-white">R</span>
          </div>
          <span className="font-heading text-base font-bold text-foreground">
            Ronda
          </span>
        </div>

        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>

      {/* ── Mobile: overlay oscuro al abrir el menú ── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile: panel lateral deslizante ── */}
      <aside
        className={`
          lg:hidden fixed inset-y-0 left-0 z-40 w-72 flex-col
          border-r border-border bg-surface
          transform transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'flex translate-x-0' : '-translate-x-full'}
        `}
      >
        <SidebarContent user={user} onClose={() => setMobileOpen(false)} />
      </aside>
    </>
  )
}
