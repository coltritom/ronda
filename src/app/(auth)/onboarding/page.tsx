"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Users, BarChart3, BookOpen, Zap } from "lucide-react";

interface Step {
  icon: React.ReactNode;
  emoji: string;
  accentBg: string;
  title: string;
  subtitle: string;
  details: string[];
}

const STEPS: Step[] = [
  {
    icon: <BookOpen size={32} className="text-uva" />,
    emoji: "📖",
    accentBg: "bg-uva/[0.08]",
    title: "Tu grupo tiene historia",
    subtitle: "Ronda guarda la memoria de cada juntada: quién fue, quién faltó, qué pasó.",
    details: [
      "Historial completo de juntadas",
      "Quién fue y quién no apareció",
      "Todo en un solo lugar, no en 50 chats",
    ],
  },
  {
    icon: <Zap size={32} className="text-fuego" />,
    emoji: "💸",
    accentBg: "bg-fuego/[0.08]",
    title: "Cuentas claras en segundos",
    subtitle: "Cargá un gasto, Ronda divide y simplifica. Sin planillas ni capturas.",
    details: [
      "Cargá un gasto en 30 segundos",
      "División automática entre todos",
      "Simplificación de deudas",
    ],
  },
  {
    icon: <BarChart3 size={32} className="text-ambar" />,
    emoji: "🏆",
    accentBg: "bg-ambar/[0.08]",
    title: "Los datos no mienten",
    subtitle: "Rankings, etiquetas y estadísticas automáticas con datos reales del grupo.",
    details: [
      "Quién es el más presente",
      "Quién es el fantasma oficial",
      "Rankings compartibles con pruebas",
    ],
  },
  {
    icon: <Users size={32} className="text-menta" />,
    emoji: "👥",
    accentBg: "bg-menta/[0.08]",
    title: "Armá tu grupo",
    subtitle: "Creá tu primer grupo y mandá el link. En 2 minutos ya están todos adentro.",
    details: [],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const next = () => {
    if (isLast) {
      router.push("/crear-grupo");
    } else {
      setStep(step + 1);
    }
  };

  const skip = () => router.push("/home");

  return (
    <div className="w-full max-w-sm flex flex-col items-center min-h-screen justify-between py-12 px-4">
      {/* Top: Logo + Skip */}
      <div className="w-full flex items-center justify-between">
        <span className="font-display font-extrabold text-xl text-fuego tracking-tight">ronda</span>
        {!isLast && (
          <button
            onClick={skip}
            className="text-[13px] text-niebla bg-transparent border-none cursor-pointer font-medium"
          >
            Omitir
          </button>
        )}
      </div>

      {/* Center: Content */}
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <div className={`w-28 h-28 rounded-[28px] ${current.accentBg} flex items-center justify-center mb-8 transition-all duration-300`}>
          <span className="text-5xl">{current.emoji}</span>
        </div>

        <h2 className="font-display font-bold text-2xl text-humo text-center leading-snug mb-3">
          {current.title}
        </h2>

        <p className="text-[15px] text-niebla text-center leading-relaxed max-w-[320px] mb-6">
          {current.subtitle}
        </p>

        {current.details.length > 0 && (
          <div className="w-full bg-noche-media rounded-2xl p-4 flex flex-col gap-3">
            {current.details.map((d, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-fuego text-sm mt-0.5 shrink-0">✓</span>
                <span className="text-sm text-humo leading-relaxed">{d}</span>
              </div>
            ))}
          </div>
        )}

        {isLast && (
          <div className="w-full flex flex-col gap-3 mt-2">
            <div className="bg-noche-media rounded-2xl p-5 text-center">
              <p className="text-sm text-niebla mb-4">
                Ya estás adentro. Ahora falta que vengan los demás.
              </p>
              <div className="flex justify-center gap-2 mb-4">
                {["🔥", "⚽", "🏖️", "🎮", "🍕"].map((e) => (
                  <div
                    key={e}
                    className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-xl cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    {e}
                  </div>
                ))}
              </div>
              <input
                type="text"
                placeholder="Ponele nombre al grupo"
                className="
                  w-full px-3.5 py-3 rounded-[10px]
                  border-[1.5px] border-white/[0.08]
                  bg-noche
                  text-[15px] text-humo text-center
                  placeholder:text-niebla/50
                  outline-none font-body
                  focus:border-fuego/50 transition-colors
                "
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom: Dots + CTAs */}
      <div className="w-full flex flex-col items-center gap-5">
        <div className="flex items-center gap-2">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`
                h-2 rounded-full transition-all duration-300 border-none cursor-pointer
                ${i === step ? "w-7 bg-fuego" : "w-2 bg-niebla/25"}
              `}
            />
          ))}
        </div>

        <Button full big onClick={next}>
          {isLast ? "Crear grupo" : "Siguiente"}
        </Button>

        {isLast && (
          <button
            onClick={skip}
            className="text-sm font-semibold text-fuego bg-transparent border-none cursor-pointer py-1"
          >
            Tengo un link de invitación
          </button>
        )}
      </div>
    </div>
  );
}
