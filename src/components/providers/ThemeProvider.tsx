'use client'

/*
  Wrapper de next-themes.
  Necesita ser un Client Component ("use client") porque usa
  contexto de React internamente para compartir el tema.
  Lo importamos en layout.tsx (Server Component) — Next.js
  permite anidar Client Components dentro de Server Components.
*/
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ThemeProviderProps } from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
