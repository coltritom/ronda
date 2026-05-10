import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/lib/theme-context";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ordenalaronda.com"),
  title: "Ronda — La memoria de tus juntadas",
  description: "Registrá juntadas, cerrá cuentas, exponé al fantasma del grupo y guardá la historia.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ronda",
    startupImage: "/icon-512.png",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#E06347",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className="antialiased" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <ThemeProvider>{children}</ThemeProvider>
        <Toaster position="bottom-center" theme="dark" richColors />
      </body>
    </html>
  );
}
