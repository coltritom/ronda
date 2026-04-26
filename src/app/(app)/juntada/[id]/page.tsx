"use client";

import { use, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { InnerTabs } from "@/components/ui/InnerTabs";
import { TabAsistencia } from "@/components/juntada/TabAsistencia";
import { TabAportes } from "@/components/juntada/TabAportes";
import { TabGastos } from "@/components/juntada/TabGastos";
import { TabCuentas } from "@/components/juntada/TabCuentas";

const TABS = ["Asistencia", "Aportes", "Gastos", "Cuentas"];

const JUNTADAS_DB: Record<string, { name: string; date: string; closed: boolean; isoDate: string }> = {
  "j1":     { name: "Asado en lo de Mati",  date: "Sábado 29 de marzo, 2026",      closed: true,  isoDate: "2026-03-29" },
  "j2":     { name: "Pizzas + fútbol",       date: "Sábado 5 de abril, 2026",       closed: false, isoDate: "2026-04-05" },
  "j2-next":{ name: "Asado del finde",       date: "Sábado 19 de abril, 20:00",     closed: false, isoDate: "2026-04-19" },
  "j3":     { name: "Fútbol miércoles",      date: "Jueves 2 de abril, 2026",       closed: true,  isoDate: "2026-04-02" },
  "j3-next":{ name: "Fútbol miércoles",      date: "Miércoles 16 de abril, 21:00",  closed: false, isoDate: "2026-04-16" },
  "j4":     { name: "Fútbol miércoles",      date: "Jueves 26 de marzo, 2026",      closed: true,  isoDate: "2026-03-26" },
  "j5":     { name: "Escapada a la costa",   date: "Sábado 15 de marzo, 2026",      closed: false, isoDate: "2026-03-15" },
};

function JuntadaContent({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("Asistencia");

  const juntada = JUNTADAS_DB[id];
  const isNew = !juntada;
  const isClosed = juntada?.closed ?? false;

  const TODAY = new Date().toISOString().slice(0, 10);
  const isoDate = juntada?.isoDate ?? searchParams.get("iso") ?? TODAY;
  const isUpcoming = !isClosed && isoDate >= TODAY;

  const displayName = juntada?.name || searchParams.get("n") || "Nueva juntada";
  const displayDate = juntada?.date || searchParams.get("d") || new Date().toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const displayLugar = searchParams.get("l");

  const backGroupId = searchParams.get("g") ?? "g1";
  const backGroupName = searchParams.get("gn") ?? "Grupo";

  return (
    <div className="max-w-2xl mx-auto pb-8">
      <div className="px-4 md:px-6 pt-4 pb-2">
        <button
          onClick={() => router.push(`/grupo/${backGroupId}`)}
          className="flex items-center gap-1 text-fuego text-[13px] font-semibold bg-transparent border-none cursor-pointer p-0 mb-3"
        >
          <ChevronLeft size={16} />
          {backGroupName}
        </button>

        <div className="flex justify-between items-start">
          <div>
            <h2 className="font-display font-bold text-[22px] text-humo">
              {displayName}
            </h2>
            <p className="text-[13px] text-niebla mt-0.5">{displayDate}</p>
            {displayLugar && (
              <p className="text-[13px] text-niebla mt-0.5">{displayLugar}</p>
            )}
          </div>
          {!isNew ? (
            <span
              className={`
                shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border
                ${isClosed
                  ? "bg-menta/[0.12] text-menta border-menta/30"
                  : "bg-alerta/[0.12] text-alerta border-alerta/30"
                }
              `}
            >
              {isClosed ? "✓ Cerrada" : "Abierta"}
            </span>
          ) : (
            <span className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border bg-fuego/[0.12] text-fuego border-fuego/30">
              Nueva
            </span>
          )}
        </div>
      </div>

      <InnerTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === "Asistencia" && <TabAsistencia closed={isClosed} isNew={isNew} upcoming={isUpcoming} juntadaId={id} />}
      {activeTab === "Aportes" && <TabAportes juntadaId={id} isNew={isNew} />}
      {activeTab === "Gastos" && <TabGastos juntadaId={id} isNew={isNew} />}
      {activeTab === "Cuentas" && <TabCuentas closed={isClosed} isNew={isNew} juntadaId={id} juntadaName={displayName} />}
    </div>
  );
}

export default function JuntadaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={null}>
      <JuntadaContent id={id} />
    </Suspense>
  );
}
