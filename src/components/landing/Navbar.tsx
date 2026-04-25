"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

const NAV_LINKS = [
  { label: "Producto", href: "#producto" },
  { label: "Cómo funciona", href: "#como-funciona" },
  { label: "Precios", href: "#precios" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar() {
  const router = useRouter();
  return (
    <nav className="sticky top-0 z-50 bg-noche/90 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-[1080px] mx-auto px-4 md:px-8 flex items-center justify-between h-14 md:h-16">
        <span className="font-display font-extrabold text-xl md:text-[22px] text-fuego tracking-tight">
          ronda
        </span>

        {/* Mobile */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={() => router.push("/login")}
            className="px-4 py-2 text-sm font-medium text-niebla border border-white/20 rounded-xl hover:border-white/40 hover:text-humo transition-colors"
          >
            Entrá
          </button>
          <button
            onClick={() => router.push("/registro")}
            className="px-4 py-2 text-sm font-semibold text-white bg-fuego border border-fuego rounded-xl hover:opacity-90 transition-opacity"
          >
            Empezar
          </button>
        </div>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-niebla text-sm font-medium hover:text-humo transition-colors"
            >
              {link.label}
            </a>
          ))}
          <button
            onClick={() => router.push("/login")}
            className="px-4 py-2 text-sm font-medium text-niebla border border-white/20 rounded-xl hover:border-white/40 hover:text-humo transition-colors"
          >
            Entrá
          </button>
          <button
            onClick={() => router.push("/registro")}
            className="px-4 py-2 text-sm font-semibold text-white bg-fuego border border-fuego rounded-xl hover:opacity-90 transition-opacity"
          >
            Empezar
          </button>
        </div>
      </div>
    </nav>
  );
}
