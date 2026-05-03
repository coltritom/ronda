"use client";

import { use, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { InnerTabs } from "@/components/ui/InnerTabs";
import { TabAsistencia } from "@/components/juntada/TabAsistencia";
import { TabAportes } from "@/components/juntada/TabAportes";
import { TabGastos } from "@/components/juntada/TabGastos";
import { TabCuentas } from "@/components/juntada/TabCuentas";
import { createClient } from "@/lib/supabase/clients";

const TABS = ["Asistencia", "Aportes", "Gastos", "Cuentas"];

function JuntadaContent({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") ?? "Asistencia");
  const [eventStatus, setEventStatus] = useState("upcoming");
  const [eventGroupId, setEventGroupId] = useState("");

  const backGroupId = searchParams.get("g") ?? "";
  const backGroupName = searchParams.get("gn") ?? "Grupo";
  const displayName = searchParams.get("n") ?? "Juntada";
  const displayDate = searchParams.get("d") ?? "";
  const displayLugar = searchParams.get("l");
  const isoDate = searchParams.get("iso") ?? new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("events").select("status, group_id").eq("id", id).single()
      .then(({ data, error }) => {
        if (error) { router.push("/groups"); return; }
        if (data) {
          setEventStatus(data.status ?? "upcoming");
          setEventGroupId(data.group_id ?? "");
        }
      });
  }, [id, router]);

  const TODAY = new Date().toISOString().slice(0, 10);
  const isClosed = eventStatus === "completed";
  const isUpcoming = !isClosed && isoDate >= TODAY;
  const groupId = eventGroupId || backGroupId;

  return (
    <div className="max-w-2xl mx-auto pb-8">
      <div className="px-4 md:px-6 pt-4 pb-2">
        <button
          onClick={() => router.push(`/groups/${backGroupId || eventGroupId}`)}
          className="flex items-center gap-1 text-fuego text-[13px] font-semibold bg-transparent border-none cursor-pointer p-0 mb-3"
        >
          <ChevronLeft size={16} />
          {backGroupName}
        </button>

        <div className="flex justify-between items-start">
          <div>
            <h2 className="font-display font-bold text-[22px] text-humo">{displayName}</h2>
            <p className="text-[13px] text-niebla mt-0.5">{displayDate}</p>
            {displayLugar && <p className="text-[13px] text-niebla mt-0.5">{displayLugar}</p>}
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
            isClosed
              ? "bg-menta/[0.12] text-menta border-menta/30"
              : "bg-alerta/[0.12] text-alerta border-alerta/30"
          }`}>
            {isClosed ? "✓ Cerrada" : "Abierta"}
          </span>
        </div>
      </div>

      <InnerTabs tabs={TABS} active={activeTab} onChange={(tab) => {
          setActiveTab(tab);
          const p = new URLSearchParams(searchParams.toString());
          p.set("tab", tab);
          router.replace(`/juntada/${id}?${p.toString()}`, { scroll: false });
        }} />

      {activeTab === "Asistencia" && <TabAsistencia closed={isClosed} upcoming={isUpcoming} juntadaId={id} groupId={groupId} />}
      {activeTab === "Aportes" && <TabAportes juntadaId={id} groupId={groupId} />}
      {activeTab === "Gastos" && <TabGastos juntadaId={id} />}
      {activeTab === "Cuentas" && <TabCuentas closed={isClosed} juntadaId={id} juntadaName={displayName} groupId={groupId} />}
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
