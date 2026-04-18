import type { Metadata } from "next";
import { ThemeProvider } from "@/lib/theme-context";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ronda — La memoria de tus juntadas",
  description: "Registrá juntadas, cerrá cuentas, exponé al fantasma del grupo y guardá la historia.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
        <Toaster position="bottom-center" theme="dark" richColors />
      </body>
    </html>
  );
}
