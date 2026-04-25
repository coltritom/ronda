"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { JuntadaCard } from "@/components/juntada/JuntadaCard";
import { MOCK_GROUP_DETAILS, getGroup } from "@/lib/constants";
import { getNewJuntadas } from "@/lib/store";
import { fmtARS } from "@/lib/utils";

type Filtro = "todas" | "abiertas" | "cerradas";

export default function HistorialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [filtro, setFiltro] = useState<Filtro>("todas");

  const group = getGroup(id);
  const detail = MOCK_GROUP_DETAILS[id] ?? MOCK_GROUP_DETAILS["g1"];
  const TODAY = new Date().toISOString().slice(0, 10);

  if (!group) {
    return (
      <div className="max-w-2xl mx-auto px-4 md:px-6 pt-8 pb-8 text-center">
        <p className="text-sm text-niebla mb-4">Grupo no encontrado.</p>
        <a href="/home" className="text-fuego text-sm font-semibold">Ir al inicio</a>
      </div>
    );
  }

  const allPast = [...getNewJuntadas(id), ...detail.juntadas]
    .filter((j) => j.isoDate < TODAY)
    .sort((a, b) => b.isoDate.localeCompare(a.isoDate));

  const filtered = allPast.filter((j) => {
    if (filtro === "abiertas") return !j.closed;
    if (filtro === "cerradas") return j.closed;
    return true;
  });

  const totalJuntadas = allPast.length;
  const totalGastado = allPast.reduce((s, j) => s + j.totalSpent, 0);

  return (
    <div className="max-w-2xl mx-auto pb-8">
      <div className="px-4 md:px-6 pt-4 pb-2">
        <button
          onClick={() => router.push(`/grupo/${id}`)}
          className="flex items-center gap-1 text-fuego text-[13px] font-semibold bg-transparent border-none cursor-pointer p-0 mb-3"
        >
          <ChevronLeft size={16} />
          {group.name}
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
                  {allPast.filter((j) => !j.closed).length}
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
                : "No hay juntadas cerradas todavía."}
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
