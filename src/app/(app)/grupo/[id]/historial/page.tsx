"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { JuntadaCard } from "@/components/juntada/JuntadaCard";
import { fmtARS } from "@/lib/utils";
import { createClient } from "@/lib/supabase/clients";

type Filtro = "todas" | "abiertas" | "cerradas";

interface JuntadaRow {
  id: string;
  isoDate: string;
  date: string;
  name: string;
  attendees: number;
  totalSpent: number;
  closed: boolean;
}

export default function HistorialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState("");
  const [juntadas, setJuntadas] = useState<JuntadaRow[]>([]);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: groupData } = await supabase
      .from("groups")
      .select("id, name")
      .eq("id", id)
      .single();

    if (!groupData) { router.push("/grupos"); return; }
    setGroupName(groupData.name);

    const { data: eventsRaw } = await supabase
      .from("events")
      .select("id, name, date, status")
      .eq("group_id", id)
      .neq("status", "cancelled")
      .order("date", { ascending: false });

    const eventIds = (eventsRaw ?? []).map((e) => e.id);
    if (!eventIds.length) { setLoading(false); return; }

    const [attendanceResult, expensesResult] = await Promise.all([
      supabase.from("event_attendance").select("event_id").in("event_id", eventIds),
      supabase.from("expenses").select("event_id, amount").in("event_id", eventIds),
    ]);

    const attendanceByEvent: Record<string, number> = {};
    for (const a of attendanceResult.data ?? []) {
      attendanceByEvent[a.event_id] = (attendanceByEvent[a.event_id] ?? 0) + 1;
    }

    const spentByEvent: Record<string, number> = {};
    for (const e of expensesResult.data ?? []) {
      spentByEvent[e.event_id] = (spentByEvent[e.event_id] ?? 0) + (e.amount ?? 0);
    }

    const TODAY = new Date().toISOString().slice(0, 10);
    const mapped: JuntadaRow[] = (eventsRaw ?? [])
      .filter((e) => e.date.slice(0, 10) < TODAY)
      .map((e) => ({
        id: e.id,
        isoDate: e.date.slice(0, 10),
        date: new Intl.DateTimeFormat("es-AR", {
          weekday: "short", day: "numeric", month: "short",
          timeZone: "America/Argentina/Buenos_Aires",
        }).format(new Date(e.date)),
        name: e.name,
        attendees: attendanceByEvent[e.id] ?? 0,
        totalSpent: spentByEvent[e.id] ?? 0,
        closed: e.status === "completed",
      }));

    setJuntadas(mapped);
    setLoading(false);
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="max-w-lg mx-auto px-4 md:px-6 pt-8 flex flex-col gap-4 animate-pulse">
      <div className="h-6 w-40 rounded-xl bg-noche-media" />
      <div className="h-16 rounded-2xl bg-noche-media" />
      <div className="h-16 rounded-2xl bg-noche-media" />
      <div className="h-16 rounded-2xl bg-noche-media" />
    </div>
  );

  const allPast = juntadas.sort((a, b) => b.isoDate.localeCompare(a.isoDate));

  const filtered = allPast.filter((j) => {
    if (filtro === "abiertas") return !j.closed;
    if (filtro === "cerradas") return j.closed;
    return true;
  });

  const totalGastado = allPast.reduce((s, j) => s + j.totalSpent, 0);

  return (
    <div className="max-w-2xl mx-auto pb-8">
      <div className="px-4 md:px-6 pt-4 pb-2">
        <button
          onClick={() => router.push(`/grupo/${id}`)}
          className="flex items-center gap-1 text-fuego text-[13px] font-semibold bg-transparent border-none cursor-pointer p-0 mb-3"
        >
          <ChevronLeft size={16} />
          {groupName}
        </button>
        <h1 className="font-display font-bold text-[22px] text-humo">
          Historial de juntadas
        </h1>
      </div>

      <div className="px-4 md:px-6 mb-4">
        <div className="bg-noche-media rounded-2xl p-4 flex gap-6">
          <div>
            <p className="font-display font-bold text-2xl text-humo">{allPast.length}</p>
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
              <span className="ml-1.5 text-[11px]">
                {f.value === "todas" && allPast.length}
                {f.value === "abiertas" && allPast.filter((j) => !j.closed).length}
                {f.value === "cerradas" && allPast.filter((j) => j.closed).length}
              </span>
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
                : filtro === "cerradas"
                ? "No hay juntadas cerradas todavía."
                : "Todavía no hay juntadas pasadas."}
            </p>
          </div>
        ) : (
          filtered.map((j) => (
            <JuntadaCard
              key={j.id}
              id={j.id}
              date={j.date}
              name={j.name}
              attendees={j.attendees}
              totalSpent={j.totalSpent}
              closed={j.closed}
              groupId={id}
              groupName={groupName}
            />
          ))
        )}
      </div>
    </div>
  );
}
