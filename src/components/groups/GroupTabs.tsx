'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { label: 'Juntadas',      path: '',               adminOnly: false },
  { label: 'Rankings',      path: '/rankings',      adminOnly: false },
  { label: 'Etiquetas',     path: '/etiquetas',     adminOnly: false },
  { label: 'Miembros',      path: '/miembros',      adminOnly: false },
  { label: 'Configuración', path: '/configuracion', adminOnly: true  },
]

export function GroupTabs({ groupId, isAdmin }: { groupId: string; isAdmin: boolean }) {
  const pathname = usePathname()
  const base = `/groups/${groupId}`

  return (
    <nav className="-mb-px flex gap-6 overflow-x-auto">
      {TABS.filter((t) => !t.adminOnly || isAdmin).map(({ label, path }) => {
        const href = `${base}${path}`
        const isActive = path === '' ? pathname === base : pathname.startsWith(href)

        return (
          <Link
            key={label}
            href={href}
            className={`
              flex-shrink-0 border-b-2 pb-3 pt-3 text-sm font-medium
              transition-colors whitespace-nowrap
              ${isActive
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-foreground'
              }
            `}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
