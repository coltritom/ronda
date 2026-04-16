"use client";

import { useRouter } from "next/navigation";
import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";

const FREE_FEATURES = [
  "Hasta 2 grupos",
  "Hasta 10 integrantes",
  "Gastos y cuentas ilimitados",
  "Rankings básicos",
  "Historial de juntadas",
];

const PRO_FEATURES = [
  "Grupos ilimitados",
  "Hasta 20 integrantes",
  "Todos los rankings y etiquetas",
  "Cards compartibles con branding",
  "Estadísticas anuales (Wrapped)",
  "Etiquetas custom del grupo",
  "Soporte prioritario",
];

export function Pricing() {
  const router = useRouter();
  return (
    <section id="precios" className="max-w-[1080px] mx-auto px-4 md:px-8 py-16">
      <div className="text-center mb-8 md:mb-14">
        <Pill color="menta">Precios</Pill>
        <h2 className="font-display font-extrabold text-[28px] md:text-[40px] mt-5 mb-2.5 tracking-tight">
          Simple como tiene que ser
        </h2>
        <p className="text-[15px] md:text-[17px] text-niebla max-w-[480px] mx-auto">
          Empezá gratis. Si tu grupo quiere más, el admin desbloquea Pro por menos que una cerveza por mes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-[720px] mx-auto">
        {/* Free */}
        <div className="p-7 md:p-9 rounded-[20px] bg-noche-media border border-white/[0.06]">
          <h3 className="font-display font-bold text-[22px]">Gratis</h3>
          <p className="font-display font-extrabold text-[32px] mt-2 mb-1">
            $0<span className="text-[15px] font-medium text-niebla">/mes</span>
          </p>
          <p className="text-[13px] text-niebla mb-5">Para siempre. Sin trampas.</p>
          {FREE_FEATURES.map((f) => (
            <div key={f} className="flex gap-2 items-start mb-2.5">
              <span className="text-menta text-[13px] mt-0.5">✓</span>
              <span className="text-sm text-humo">{f}</span>
            </div>
          ))}
          <div className="mt-6">
            <Button full primary={false} onClick={() => router.push("/registro")}>Empezar gratis</Button>
          </div>
        </div>

        {/* Pro */}
        <div className="p-7 md:p-9 rounded-[20px] bg-noche-media border-2 border-fuego/30 relative">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-fuego text-white px-3.5 py-1 rounded-full text-[11px] font-bold">
            Más popular
          </span>
          <h3 className="font-display font-bold text-[22px]">Pro</h3>
          <p className="font-display font-extrabold text-[32px] mt-2 mb-1">
            $2.99<span className="text-[15px] font-medium text-niebla">/mes</span>
          </p>
          <p className="text-[13px] text-niebla mb-5">Por grupo. Lo paga solo el admin.</p>
          {PRO_FEATURES.map((f) => (
            <div key={f} className="flex gap-2 items-start mb-2.5">
              <span className="text-fuego text-[13px] mt-0.5">✓</span>
              <span className="text-sm text-humo">{f}</span>
            </div>
          ))}
          <div className="mt-6">
            <Button full>Probar Pro gratis 14 días</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
