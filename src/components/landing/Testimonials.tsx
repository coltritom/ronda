const ITEMS = [
  { name: "Mati R.", handle: "@matir_", text: "Le debían todos plata y nadie se acordaba. Se armó el grupo en Ronda y en 2 minutos estaba todo claro.", avatar: "🧔" },
  { name: "Caro L.", handle: "@caaroo", text: "Lo mejor son los rankings. El fantasma del grupo no puede decir nada porque los datos están ahí.", avatar: "👱‍♀️" },
  { name: "Facu D.", handle: "@facundod", text: "Siempre era un quilombo dividir el asado. Ahora se carga, se divide y listo. Cero discusiones.", avatar: "🧑" },
  { name: "Lucía M.", handle: "@luciamza", text: "Me encanta que guarde el historial. Podemos ver cuántas veces nos juntamos en el año.", avatar: "👩" },
  { name: "Nico S.", handle: "@nicosdev", text: "Soy el fantasma oficial del grupo. No me quejo, los datos no mienten.", avatar: "😎" },
  { name: "Juli P.", handle: "@juliparra", text: "Lo compartimos por WhatsApp y en 5 minutos ya estaban todos adentro. Cero fricción.", avatar: "🤙" },
];

export function Testimonials() {
  return (
    <section className="pt-3 pb-8">
      <p className="text-center text-[13px] text-niebla font-medium mb-5">
        Los grupos que ya usan Ronda tienen algo que decir
      </p>
      <div className="overflow-hidden w-full">
        <div className="flex gap-3.5 animate-scroll-x w-max">
          {[...ITEMS, ...ITEMS].map((t, i) => (
            <div
              key={i}
              className="min-w-[270px] max-w-[290px] p-4 rounded-2xl bg-noche-media border border-white/[0.06] shrink-0"
            >
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="w-[34px] h-[34px] rounded-full bg-fuego/[0.15] flex items-center justify-center text-[17px]">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-semibold text-[13px] text-humo">{t.name}</p>
                  <p className="text-[11px] text-niebla">{t.handle}</p>
                </div>
              </div>
              <p className="text-[13px] text-humo/90 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes scroll-x {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll-x {
          animation: scroll-x 40s linear infinite;
        }
      `}</style>
    </section>
  );
}
