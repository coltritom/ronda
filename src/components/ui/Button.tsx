/*
  Botón reutilizable con variantes y estado de carga.

  Variantes:
  - primary  → naranja terracota (acción principal)
  - secondary → borde sutil (acción secundaria)
  - ghost    → sin fondo (links/iconos)

  Uso: <Button loading={isLoading}>Iniciar sesión</Button>
*/

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  loading?: boolean
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring'

  const variants = {
    primary:   'bg-accent text-accent-foreground hover:bg-accent-hover',
    secondary: 'border border-border text-foreground hover:bg-surface-2',
    ghost:     'text-muted hover:text-foreground hover:bg-surface-2',
  }

  return (
    <button
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
}
