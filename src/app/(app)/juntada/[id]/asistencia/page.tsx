"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { MOCK_MEMBERS } from "@/lib/constants";

export default function AsistenciaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [checks, setChecks] = useState<boolean[]>(
    MOCK_MEMBERS.map((_, i) => i < 6)
  );

  const toggle = (i: number) => {
    setChecks((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  };

  const count = checks.filter(Boolean).length;

  return (
    <div className="max-w-lg mx-auto pb-8">
      <div className="px-4 md:px-6 pt-4">
        <button
          onClick={() => router.push(`/juntada/${id}`)}
          className="flex items-center gap-1 text-fuego text-[13px] font-semibold bg-transparent border-none cursor-pointer p-0 mb-3"
        >
          <ChevronLeft size={16} />
          Volver
        </button>
        <h2 className="font-display font-bold text-xl text-humo">
          ¿Quién vino de verdad?
        </h2>
        <p className="text-sm text-niebla mt-1.5">
          {count} de {MOCK_MEMBERS.length} fueron
        </p>
      </div>

      <div className="px-4 md:px-6 mt-2">
        {MOCK_MEMBERS.map((m, i) => (
          <div
            key={m.id}
            onClick={() => toggle(i)}
            className={`flex items-center gap-3 py-3 cursor-pointer ${i > 0 ? "border-t border-white/[0.04]" : ""}`}
          >
            <Avatar emoji={m.emoji} name={m.name} colorIndex={m.colorIndex} />
            <span className="flex-1 text-[15px] text-humo">{m.name}</span>
            <div
              className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer ${checks[i] ? "bg-fuego" : "bg-niebla/30"}`}
            >
              <div
                className={`w-[18px] h-[18px] rounded-full bg-white absolute top-[3px] transition-[left] ${checks[i] ? "left-[21px]" : "left-[3px]"}`}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 md:px-6 mt-5">
        <Button full>Confirmar asistencia</Button>
      </div>
    </div>
  );
}
