interface PhoneMockupProps {
  children?: React.ReactNode;
}

export function PhoneMockup({ children }: PhoneMockupProps) {
  return (
    <div className="w-full max-w-[300px] md:max-w-[340px] mx-auto md:mx-0 shrink-0">
      <div className="rounded-[36px] overflow-hidden border-[2.5px] border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)] bg-noche">
        {/* Status bar */}
        <div className="px-5 pt-3 pb-2 flex justify-between items-center">
          <span className="text-[11px] font-semibold text-humo">9:41</span>
          <div className="w-[72px] h-5 rounded-[10px] bg-black" />
          <span className="text-[9px] text-humo">●●● 🔋</span>
        </div>

        {/* Screen content */}
        {children || <MiniScreenGrupo />}

        {/* Home indicator */}
        <div className="flex justify-center py-2">
          <div className="w-[90px] h-1 rounded-full bg-white/20" />
        </div>
      </div>
    </div>
  );
}

function MiniScreenGrupo() {
  return (
    <div className="px-3.5 pb-1">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-base">🔥</span>
        <span className="font-display font-bold text-[15px] text-humo">Los del asado</span>
      </div>

      {/* Alerta */}
      <div className="bg-noche-media rounded-xl p-2.5 border-l-[3px] border-alerta mb-2">
        <p className="text-[12px] font-semibold text-humo font-body">2 cuentas abiertas · $4.800</p>
      </div>

      {/* Próxima juntada */}
      <div className="bg-noche-media rounded-xl p-2.5 mb-2">
        <p className="text-[9px] text-fuego font-semibold font-body uppercase tracking-wider mb-1">Próxima juntada</p>
        <p className="text-[13px] font-semibold text-humo font-body">Sáb 5 abr, 20:00</p>
        <p className="text-[11px] text-niebla font-body mt-0.5">5 van · 2 sin respuesta</p>
      </div>

      {/* Mini ranking */}
      <div className="bg-noche-media rounded-xl p-2.5">
        <p className="font-display font-semibold text-[12px] text-humo mb-1.5">El ranking no miente</p>
        {["🏆 Mati — Invicto", "👻 Nico — Fantasma", "💰 Lucía — Billetera"].map((r, i) => (
          <p key={i} className={`text-[11px] text-niebla font-body py-1 ${i > 0 ? "border-t border-white/5" : ""}`}>
            {r}
          </p>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex justify-around pt-2.5 mt-2.5 border-t border-white/[0.06]">
        {["⌂", "👥", "🏆", "👤"].map((ic, i) => (
          <span key={i} className={`text-base ${i === 1 ? "text-fuego" : "text-niebla"}`}>{ic}</span>
        ))}
      </div>
    </div>
  );
}
