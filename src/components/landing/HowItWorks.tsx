import { Pill } from "@/components/ui/Pill";

const STEPS = [
  { step: "01", title: "Creá tu grupo", desc: "Ponele nombre, mandá el link al grupo de WhatsApp y esperá. En 2 minutos ya están todos adentro.", icon: "👥" },
  { step: "02", title: "Registrá la juntada", desc: "Marcá quién fue, cargá los gastos, anotá quién llevó qué. Todo desde el celu, en menos de un minuto.", icon: "📝" },
  { step: "03", title: "Cerrá y compartí", desc: "Ronda calcula todo, simplifica deudas y arma los rankings. Cada uno sabe cuánto debe. Compartí los resultados.", icon: "✅" },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="max-w-[1080px] mx-auto px-4 md:px-8 py-16">
      <div className="text-center mb-8 md:mb-14">
        <Pill>Cómo funciona</Pill>
        <h2 className="font-display font-extrabold text-[28px] md:text-[40px] mt-5 mb-2.5 tracking-tight">
          3 pasos. Cero fricción.
        </h2>
        <p className="text-[15px] md:text-[17px] text-niebla max-w-[440px] mx-auto">
          Más rápido que mandar un mensaje preguntando cuánto pusiste.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {STEPS.map((s) => (
          <div key={s.step} className="p-6 md:p-8 rounded-[20px] bg-noche-media border border-white/5 relative">
            <span className="font-display font-extrabold text-[40px] md:text-[48px] text-fuego/[0.07] absolute top-3.5 right-4 leading-none">
              {s.step}
            </span>
            <div className="text-[26px] mb-3.5 w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
              {s.icon}
            </div>
            <h3 className="font-display font-bold text-lg md:text-xl mb-2">{s.title}</h3>
            <p className="text-sm text-niebla leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
