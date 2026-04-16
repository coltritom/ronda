/*
  Card reutilizable.

  Variantes:
  - default     → superficie con sombra sutil, sin borde
  - bordered    → con borde sutil
  - accent-left → borde izquierdo de color (para alertas/destacados)

  Uso:
  <Card>contenido</Card>
  <Card variant="accent-left" accentColor="alerta">Tenés deudas pendientes</Card>
*/

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:     'default' | 'bordered' | 'accent-left'
  accentColor?: 'fuego' | 'alerta' | 'exito' | 'error' | 'ambar' | 'menta' | 'uva'
  padding?:     'none' | 'sm' | 'md' | 'lg'
}

const accentColors = {
  fuego:  'border-l-fuego',
  alerta: 'border-l-alerta',
  exito:  'border-l-exito',
  error:  'border-l-error',
  ambar:  'border-l-ambar',
  menta:  'border-l-menta',
  uva:    'border-l-uva',
}

export function Card({
  variant      = 'default',
  accentColor  = 'fuego',
  padding      = 'md',
  children,
  className = '',
  ...props
}: CardProps) {
  const base = 'rounded-2xl bg-surface'

  const variants = {
    default:      '',
    bordered:     'border border-border',
    'accent-left': `border-l-4 border border-border ${accentColors[accentColor]}`,
  }

  const paddings = {
    none: '',
    sm:   'p-3',
    md:   'p-4',
    lg:   'p-6',
  }

  return (
    <div
      className={`${base} ${variants[variant]} ${paddings[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
