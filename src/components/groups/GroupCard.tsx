/*
  Tarjeta de grupo para la lista.
  Muestra emoji, nombre, descripción, cantidad de miembros y rol.
  Al hacer clic navega a /groups/[id].
*/
import Link from 'next/link'
import type { GroupWithMeta } from '@/types'

interface GroupCardProps {
  group: GroupWithMeta
}

export function GroupCard({ group }: GroupCardProps) {
  const emoji = group.emoji ?? '👥'

  return (
    <Link
      href={`/groups/${group.id}`}
      className="
        group flex items-center gap-4
        rounded-2xl border border-border bg-surface
        p-4 sm:p-5
        hover:bg-surface-2 hover:border-accent/30
        transition-all duration-150
      "
    >
      {/* Emoji del grupo */}
      <div className="
        flex h-12 w-12 flex-shrink-0 items-center justify-center
        rounded-xl bg-surface-2 text-2xl
        group-hover:bg-background
        transition-colors
      ">
        {emoji}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-heading font-semibold text-foreground truncate">
            {group.name}
          </h3>
          {group.role === 'admin' && (
            <span className="flex-shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
              Admin
            </span>
          )}
        </div>

        {group.description && (
          <p className="mt-0.5 text-sm text-muted truncate">
            {group.description}
          </p>
        )}

        <p className="mt-1 text-xs text-muted">
          {group.member_count} {group.member_count === 1 ? 'miembro' : 'miembros'}
        </p>
      </div>

      {/* Flecha */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="flex-shrink-0 text-muted group-hover:text-accent transition-colors"
      >
        <path d="M9 18l6-6-6-6"/>
      </svg>
    </Link>
  )
}
