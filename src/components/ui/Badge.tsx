/*
  Badge / Pill reutilizable.

  Variantes de color:
  - ambar  → rankings positivos, medallas, podio
  - menta  → éxito social (cuenta cerrada, juntada completada)
  - uva    → rankings sensibles, etiquetas especiales
  - rosa   → cards compartibles, celebración
  - fuego  → CTA inline, destacado de marca
  - neutral → sin acento (etiquetas de estado)

  Uso:
  <Badge variant="ambar" emoji="🥇">El más puntual</Badge>
  <Badge variant="menta">Cuenta cerrada</Badge>
*/

interface BadgeProps {
  variant?: 'ambar' | 'menta' | 'uva' | 'rosa' | 'fuego' | 'neutral'
  emoji?:   string
  children: React.ReactNode
  className?: string
}

const VARIANTS = {
  ambar:   'bg-ambar/15 border-ambar/40 text-ambar',
  menta:   'bg-menta/15 border-menta/40 text-menta',
  uva:     'bg-uva/15 border-uva/40 text-uva',
  rosa:    'bg-rosa/15 border-rosa/40 text-rosa',
  fuego:   'bg-fuego/15 border-fuego/40 text-fuego',
  neutral: 'bg-noche border-noche-media text-niebla',
}

export function Badge({
  variant = 'neutral',
  emoji,
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        rounded-full border px-3 py-1
        font-body text-xs font-semibold
        ${VARIANTS[variant]}
        ${className}
      `}
    >
      {emoji && <span className="text-base leading-none">{emoji}</span>}
      {children}
    </span>
  )
}
