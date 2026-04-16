"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { JuntadaCard } from "@/components/juntada/JuntadaCard";
import { fmtARS } from "@/lib/utils";

type Filtro = "todas" | "abiertas" | "cerradas";

const MOCK_HISTORIAL = [
  { id: "j1", date: "Sáb 29 mar", name: "Asado en lo de Mati", attendees: 6, totalSpent: 18200, closed: true, lugarId: "casa", hostName: "Mati" },
  { id: "j2", date: "Sáb 22 mar", name: "Pizzas + fútbol", attendees: 7, totalSpent: 12400, closed: false, lugarId: "restaurant" },
  { id: "j3", date: "Sáb 15 mar", name: "Birras en casa de Nico", attendees: 5, totalSpent: 8600, closed: true, lugarId: "casa", hostName: "Nico" },
  { id: "j4", date: "Sáb 8 mar", name: "Asado pre-feriado", attendees: 8, totalSpent: 22300, closed: true, lugarId: "casa", hostName: "Mati" },
  { id: "j5", date: "Sáb 1 mar", name: "Pádel + birras", attendees: 4, totalSpent: 6800, closed: true, lugarId: "padel" },
  { id: "j6", date: "Sáb 22 feb", name: "Cumple de Lucía", attendees: 8, totalSpent: 31500, closed: true, lugarId: "restaurant" },
  { id: "j7", date: "Sáb 15 feb", name: "After office", attendees: 6, totalSpent: 9200, closed: true, lugarId: "oficina" },
  { id: "j8", date: "Sáb 8 feb", name: "Fútbol 5 + asado", attendees: 7, totalSpent: 19800, closed: true, lugarId: "futbol5" },
];

export default function HistorialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [filtro, setFiltro] = useState<Filtro>("todas");

  const filtered = MOCK_HISTORIAL.filter((j) => {
    if (filtro === "abiertas") return !j.closed;
    if (filtro === "cerradas") return j.closed;
    return true;
  });

  const totalJuntadas = MOCK_HISTORIAL.length;
  const totalGastado = MOCK_HISTORIAL.reduce((s, j) => s + j.totalSpent, 0);

  return (
    <div className="max-w-2xl mx-auto pb-8">
      <div className="px-4 md:px-6 pt-4 pb-2">
        <button
          onClick={() => router.push(`/grupo/${id}`)}
          className="flex items-center gap-1 text-fuego text-[13px] font-semibold bg-transparent border-none cursor-pointer p-0 mb-3"
        >
          <ChevronLeft size={16} />
          Los del asado
        </button>
        <h1 className="font-display font-bold text-[22px] text-humo">
          Historial de juntadas
        </h1>
      </div>

      <div className="px-4 md:px-6 mb-4">
        <div className="bg-noche-media rounded-2xl p-4 flex gap-6">
          <div>
            <p className="font-display font-bold text-2xl text-humo">{totalJuntadas}</p>
            <p className="text-xs text-niebla">juntadas</p>
          </div>
          <div>
            <p className="font-display font-bold text-2xl text-humo">
              ${fmtARS(totalGastado)}
            </p>
            <p className="text-xs text-niebla">gastados en total</p>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 mb-4">
        <div className="flex gap-2">
          {([
            { value: "todas", label: "Todas" },
            { value: "abiertas", label: "Abiertas" },
            { value: "cerradas", label: "Cerradas" },
          ] as { value: Filtro; label: string }[]).map((f) => (
            <button
              key={f.value}
              onClick={() => setFiltro(f.value)}
              className={`
                px-3.5 py-1.5 rounded-full text-[13px] font-semibold border-none cursor-pointer transition-all
                ${filtro === f.value
                  ? "bg-fuego/[0.12] text-fuego ring-1 ring-fuego/30"
                  : "bg-white/5 text-niebla"
                }
              `}
            >
              {f.label}
              {f.value === "abiertas" && (
                <span className="ml-1.5 text-[11px]">
                  {MOCK_HISTORIAL.filter((j) => !j.closed).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 md:px-6 flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-niebla">
              {filtro === "abiertas"
                ? "No hay juntadas abiertas. Todo al día."
                : "No hay juntadas cerradas todavía."
              }
            </p>
          </div>
        ) : (
          filtered.map((j) => (
            <JuntadaCard key={j.id} {...j} />
          ))
        )}
      </div>
    </div>
  );
}
