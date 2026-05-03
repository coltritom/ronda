/*
  Tarjeta de grupo para la lista de Mis grupos.
  Navega a /groups/[id] al hacer clic.
*/
import Link from 'next/link'
import { ChevronRight, Users } from 'lucide-react'
import type { GroupWithMeta } from '@/types'

interface GroupCardProps {
  group: GroupWithMeta
}

/* Color de avatar del grupo — rotativo basado en el id */
const GROUP_COLORS = [
  'bg-uva/20 text-uva',
  'bg-menta/20 text-menta',
  'bg-ambar/20 text-ambar',
  'bg-fuego/20 text-fuego',
  'bg-rosa/20 text-rosa',
]

function groupColorClass(id: string) {
  return GROUP_COLORS[id.charCodeAt(0) % GROUP_COLORS.length]
}

export function GroupCard({ group }: GroupCardProps) {
  const initial    = group.name.trim().charAt(0).toUpperCase()
  const colorClass = groupColorClass(group.id)

  return (
    <Link
      href={`/groups/${group.id}`}
      className="group flex items-center gap-4 rounded-2xl border border-transparent bg-noche-media p-4 hover:border-fuego/30 hover:bg-noche transition-all duration-150"
    >
      {/* Avatar del grupo */}
      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl font-heading text-xl font-bold transition-colors ${colorClass}`}>
        {group.emoji ?? initial}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-heading font-semibold text-humo truncate">
            {group.name}
          </h3>
          {group.role === 'admin' && (
            <span className="flex-shrink-0 rounded-full bg-fuego/10 px-2 py-0.5 font-body text-xs font-semibold text-fuego">
              Admin
            </span>
          )}
        </div>

        {group.description && (
          <p className="mt-0.5 font-body text-sm text-niebla truncate">
            {group.description}
          </p>
        )}

        <div className="mt-1.5 flex items-center gap-1.5 text-niebla">
          <Users size={12} />
          <span className="font-body text-xs">
            {group.member_count} {group.member_count === 1 ? 'miembro' : 'miembros'}
          </span>
        </div>
      </div>

      {/* Flecha */}
      <ChevronRight
        size={16}
        className="flex-shrink-0 text-niebla group-hover:text-fuego transition-colors"
      />
    </Link>
  )
}
