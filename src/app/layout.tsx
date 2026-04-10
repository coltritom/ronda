import type { Metadata } from 'next'
import { Outfit, Source_Sans_3, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/ThemeProvider'

/* ─── Fuentes de Google ──────────────────────────────────────────
   Next.js las descarga en build time y las sirve desde su propio
   dominio — sin llamadas externas a Google en producción.
─────────────────────────────────────────────────────────────── */
const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',        // CSS var usable en globals.css
})

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-source-sans',
  weight: ['300', '400', '600', '700'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  weight: ['400', '500', '700'],
})

export const metadata: Metadata = {
  title: {
    default: 'Ronda',
    template: '%s · Ronda',   // páginas hijas: "Grupos · Ronda"
  },
  description: 'Tracking social para grupos de amigos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    /*
      suppressHydrationWarning: evita el warning de React cuando
      next-themes modifica la clase del <html> en el cliente.
    */
    <html
      lang="es"
      suppressHydrationWarning
      className={`${outfit.variable} ${sourceSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-background text-foreground font-body antialiased min-h-screen">
        <ThemeProvider
          attribute="class"       // agrega class="dark" al <html>
          defaultTheme="dark"     // dark mode por defecto
          enableSystem={false}    // ignorar preferencia del SO
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
