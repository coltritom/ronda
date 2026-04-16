const ACTIVITIES = [
  { icon: "💸", text: "Mati cargó un gasto en Los del asado", detail: "$12.000 · Carne y carbón", time: "hace 2h" },
  { icon: "✅", text: "Se cerraron las cuentas de Fútbol 5", detail: "Todo saldado", time: "hace 5h" },
  { icon: "👥", text: "Caro se sumó a Depto vacaciones", detail: "", time: "hace 1d" },
  { icon: "🏆", text: "Nuevo ranking en Los del asado", detail: "Mati es el más presente", time: "hace 2d" },
  { icon: "📝", text: "Nico creó una juntada en Fútbol 5", detail: "Partido semanal — Mié 9 abr", time: "hace 2d" },
];

export function RecentActivity() {
  return (
    <div className="px-4 md:px-6 mb-3">
      <p className="font-display font-semibold text-[15px] text-carbon dark:text-humo mb-2">
        Actividad reciente
      </p>

      <div className="bg-noche-media dark:bg-noche-media bg-crema rounded-2xl py-1">
        {ACTIVITIES.map((a, i) => (
          <div
            key={i}
            className={`
              flex gap-2.5 px-3.5 py-2.5
              ${i > 0 ? "border-t border-white/[0.04] dark:border-white/[0.04] border-black/[0.04]" : ""}
            `}
          >
            <span className="text-base mt-0.5 shrink-0">{a.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-carbon dark:text-humo m-0 leading-snug">{a.text}</p>
              {a.detail && (
                <p className="text-[11px] text-gris-cal dark:text-niebla mt-0.5">{a.detail}</p>
              )}
            </div>
            <span className="text-[10px] text-gris-cal/50 dark:text-niebla/50 whitespace-nowrap shrink-0 mt-0.5">
              {a.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
