import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-noche flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        {/* Logo */}
        <span className="font-display font-extrabold text-2xl text-fuego tracking-tight">
          ronda
        </span>

        {/* Ilustración */}
        <div className="relative my-8 mx-auto h-24 w-24">
          <div className="absolute inset-0 rounded-full border border-fuego/20" />
          <div className="absolute inset-2 rounded-full border border-fuego/15" />
          <div className="absolute inset-4 rounded-full border border-fuego/10" />
          <div className="absolute inset-[30%] rounded-full bg-fuego/10" />
          <div className="absolute inset-0 flex items-center justify-center text-3xl">
            👻
          </div>
        </div>

        {/* Código */}
        <p className="font-mono text-xs text-niebla/50 mb-2 tracking-widest">404</p>

        <h1 className="font-heading text-xl font-bold text-humo mb-2">
          Esta página no existe
        </h1>
        <p className="font-body text-sm text-niebla leading-relaxed mb-8 max-w-[260px] mx-auto">
          Capaz el link estaba roto, o esta ruta fue al Más Allá. Volvé al inicio y seguí desde ahí.
        </p>

        <Link
          href="/home"
          className="
            inline-block w-full max-w-xs py-3 rounded-xl
            font-semibold text-[15px] text-white text-center
            bg-fuego hover:bg-fuego/90 active:scale-[0.98] transition-all
          "
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
