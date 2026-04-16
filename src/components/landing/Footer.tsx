const LINKS = ["Producto", "Precios", "FAQ", "Contacto"];

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-8">
      <div className="max-w-[1080px] mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-5 text-center md:text-left">
        <div>
          <span className="font-display font-extrabold text-xl text-fuego">ronda</span>
          <p className="text-[13px] text-niebla mt-1">El tracker de tu grupo.</p>
        </div>

        <div className="hidden md:flex gap-6">
          {LINKS.map((l) => (
            <a key={l} href="#" className="text-niebla text-sm hover:text-humo transition-colors no-underline">
              {l}
            </a>
          ))}
        </div>

        <div className="md:text-right">
          <p className="text-[13px] text-niebla">Hecho con ❤️ en Argentina</p>
          <p className="text-xs text-niebla/50 mt-1">© 2026 Ronda · Términos · Privacidad</p>
        </div>
      </div>
    </footer>
  );
}
