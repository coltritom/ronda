"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { PhoneMockup } from "@/components/landing/PhoneMockup";

const MINI_STATS = [
  { value: "100%", label: "gratis para empezar" },
  { value: "30seg", label: "cargar un gasto" },
  { value: "0", label: "planillas de Excel" },
];

export function Hero() {
  const router = useRouter();
  return (
    <section className="max-w-[1080px] mx-auto px-4 md:px-8 pt-12 md:pt-20 pb-12 md:pb-20 flex flex-col md:flex-row items-center gap-10 md:gap-16 relative">
      {/* Glow decorativo */}
      <div className="absolute top-10 -left-24 w-72 h-72 rounded-full bg-fuego/[0.04] blur-[80px] pointer-events-none" />

      {/* Texto */}
      <div className="flex-1 relative z-10 text-center md:text-left">
        <Pill>✨ La memoria de tus juntadas</Pill>

        <h1 className="font-display font-extrabold text-[38px] md:text-[46px] lg:text-[56px] leading-[1.08] mt-5 mb-4 tracking-tight">
          Tu grupo<br />tiene historia.
        </h1>

        <p className="text-base md:text-lg leading-relaxed text-niebla max-w-[440px] mx-auto md:mx-0 mb-7">
          Ronda registra cada juntada, cierra las cuentas en segundos, arma rankings
          con datos reales y guarda la memoria colectiva de tu grupo. Todo con la onda
          que se merece.
        </p>

        <div className="flex gap-3 items-center flex-wrap justify-center md:justify-start">
          <Button big onClick={() => router.push("/registro")}>Creá tu grupo gratis</Button>
          <span className="hidden md:inline-flex">
            <Button primary={false}>Ver cómo funciona ↓</Button>
          </span>
        </div>

        <div className="mt-7 flex gap-4 md:gap-6 justify-center md:justify-start">
          {MINI_STATS.map((s) => (
            <div key={s.label} className="flex flex-col items-center md:items-start">
              <span className="font-display font-bold text-[17px] text-fuego">{s.value}</span>
              <span className="text-[11px] text-niebla">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Phone */}
      <PhoneMockup />
    </section>
  );
}
