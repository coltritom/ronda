/*
  Layout para todas las páginas de auth (login, registro, recupero).
  Los paréntesis en "(auth)" son una Route Group de Next.js:
  agrupan páginas bajo el mismo layout SIN afectar la URL.
  /login sigue siendo /login, no /auth/login.

  Este layout centra el contenido en pantalla y agrega el logo arriba.
*/
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Toggle de tema en esquina superior derecha */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
          <span className="font-heading text-xl font-bold text-white">R</span>
        </div>
        <span className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Ronda
        </span>
      </div>

      {/* Contenido de la página (formulario) */}
      {children}

      {/* Footer mínimo */}
      <p className="mt-8 text-xs text-muted">
        © {new Date().getFullYear()} Ronda
      </p>
    </div>
  )
}
