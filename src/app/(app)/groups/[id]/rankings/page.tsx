"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import RankingsContent from "./RankingsContent";
import { createClient } from "@/lib/supabase/clients";
import { fmtARS } from "@/lib/utils";
import type { RankedMember, BadgeEntry } from "./RankingsContent";

export default function GroupRankingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState("");
  const [asistencias, setAsistencias] = useState<RankedMember[]>([]);
  const [aportes, setAportes] = useState<RankedMember[]>([]);
  const [anfitrion, setAnfitrion] = useState<RankedMember[]>([]);
  const [destacados, setDestacados] = useState<BadgeEntry[]>([]);
  const [datos, setDatos] = useState<BadgeEntry[]>([]);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: groupData } = await supabase
      .from("groups").select("id, name").eq("id", id).single();
    if (!groupData) { router.push("/groups"); return; }
    setGroupName(groupData.name);

    const { data: membersRaw } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", id);

    const memberUserIds = (membersRaw ?? []).map(m => m.user_id);
    const { data: profilesData } = await supabase.from("profiles").select("id, name").in("id", memberUserIds);
    const profileMap = Object.fromEntries((profilesData ?? []).map(p => [p.id, p.name]));

    const members = (membersRaw ?? []).map((m, i) => ({
      userId: m.user_id,
      name: profileMap[m.user_id] ?? "Usuario",
      colorIndex: i,
    }));

    const { data: eventsRaw } = await supabase
      .from("events")
      .select("id")
      .eq("group_id", id)
      .neq("status", "cancelled");

    const eventIds = (eventsRaw ?? []).map((e) => e.id);
    const totalEvents = eventIds.length;

    if (!eventIds.length) {
      setAsistencias(members.map((m) => ({ name: m.name, colorIndex: m.colorIndex, score: "0 juntadas" })));
      setAportes(members.map((m) => ({ name: m.name, colorIndex: m.colorIndex, score: "$0" })));
      setAnfitrion(members.map((m) => ({ name: m.name, colorIndex: m.colorIndex, score: "0 veces" })));
      setLoading(false);
      return;
    }

    const [attendanceResult, expensesResult, rsvpResult] = await Promise.all([
      supabase.from("event_attendance").select("event_id, user_id").in("event_id", eventIds),
      supabase.from("expenses").select("id, paid_by, amount").in("event_id", eventIds),
      supabase.from("event_rsvps").select("event_id, user_id, response").in("event_id", eventIds),
    ]);

    const attendanceCounts: Record<string, number> = {};
    for (const a of attendanceResult.data ?? []) {
      attendanceCounts[a.user_id] = (attendanceCounts[a.user_id] ?? 0) + 1;
    }

    const paidAmounts: Record<string, number> = {};
    for (const e of expensesResult.data ?? []) {
      paidAmounts[e.paid_by] = (paidAmounts[e.paid_by] ?? 0) + (e.amount ?? 0);
    }
    const totalPaid = Object.values(paidAmounts).reduce((s, v) => s + v, 0);

    const attendedSet = new Set(
      (attendanceResult.data ?? []).map((a) => `${a.event_id}:${a.user_id}`)
    );
    const ghostCounts: Record<string, number> = {};
    for (const r of rsvpResult.data ?? []) {
      if (r.response === "going" && !attendedSet.has(`${r.event_id}:${r.user_id}`)) {
        ghostCounts[r.user_id] = (ghostCounts[r.user_id] ?? 0) + 1;
      }
    }

    const asistenciasRanked = [...members]
      .map((m) => ({ ...m, count: attendanceCounts[m.userId] ?? 0 }))
      .sort((a, b) => b.count - a.count)
      .map((m) => ({
        name: m.name,
        colorIndex: m.colorIndex,
        score: `${m.count}/${totalEvents} juntadas`,
      }));

    const aportesRanked = [...members]
      .map((m) => ({ ...m, amount: paidAmounts[m.userId] ?? 0 }))
      .sort((a, b) => b.amount - a.amount)
      .map((m) => ({
        name: m.name,
        colorIndex: m.colorIndex,
        score: `$${fmtARS(m.amount)}`,
      }));

    const anfitrionRanked = [...members].map((m) => ({
      name: m.name,
      colorIndex: m.colorIndex,
      score: "0 veces",
    }));

    setAsistencias(asistenciasRanked);
    setAportes(aportesRanked);
    setAnfitrion(anfitrionRanked);

    const newDestacados: BadgeEntry[] = [];

    const topAttendance = [...members]
      .map((m) => ({ ...m, count: attendanceCounts[m.userId] ?? 0 }))
      .sort((a, b) => b.count - a.count)[0];

    if (topAttendance?.count > 0) {
      newDestacados.push({
        emoji: "🏆",
        label: "El más presente",
        name: topAttendance.name,
        detail: `${topAttendance.count} de ${totalEvents} juntada${totalEvents !== 1 ? "s" : ""}`,
        colorIndex: topAttendance.colorIndex,
        variant: "ambar",
      });
    }

    const topPayer = [...members]
      .map((m) => ({ ...m, amount: paidAmounts[m.userId] ?? 0 }))
      .sort((a, b) => b.amount - a.amount)[0];

    if (topPayer?.amount > 0) {
      newDestacados.push({
        emoji: "💰",
        label: "La billetera del grupo",
        name: topPayer.name,
        detail: `Puso $${fmtARS(topPayer.amount)} en total`,
        colorIndex: topPayer.colorIndex,
        variant: "ambar",
      });
    }

    const mvpTop = [...members]
      .map((m) => {
        const att = (attendanceCounts[m.userId] ?? 0) / Math.max(1, totalEvents);
        const aporte = (paidAmounts[m.userId] ?? 0) / Math.max(1, totalPaid);
        return { ...m, score: att + aporte };
      })
      .sort((a, b) => b.score - a.score)[0];

    if (mvpTop?.score > 0) {
      newDestacados.push({
        emoji: "🏅",
        label: "MVP de la ronda",
        name: mvpTop.name,
        detail: "Mejor combinación de asistencia y aportes",
        colorIndex: mvpTop.colorIndex,
        variant: "rosa",
      });
    }

    setDestacados(newDestacados);

    const newDatos: BadgeEntry[] = [];

    const topGhost = [...members]
      .map((m) => ({ ...m, ghosts: ghostCounts[m.userId] ?? 0 }))
      .filter((m) => m.ghosts > 0)
      .sort((a, b) => b.ghosts - a.ghosts)[0];

    if (topGhost) {
      newDatos.push({
        emoji: "👻",
        label: "Fantasma oficial",
        name: topGhost.name,
        detail: `Dijo que iba pero faltó ${topGhost.ghosts} vez${topGhost.ghosts > 1 ? "es" : ""}`,
        colorIndex: topGhost.colorIndex,
        variant: "uva",
      });
    }

    setDatos(newDatos);
    setLoading(false);
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="max-w-lg mx-auto px-4 md:px-6 pt-8 flex flex-col gap-4 animate-pulse">
      <div className="h-6 w-40 rounded-xl bg-noche-media" />
      <div className="h-24 rounded-2xl bg-noche-media" />
      <div className="h-24 rounded-2xl bg-noche-media" />
    </div>
  );

  return (
    <div>
      <div className="px-4 md:px-6 pt-4">
        <button
          onClick={() => router.push(`/groups/${id}`)}
          className="flex items-center gap-1 text-fuego text-[13px] font-semibold bg-transparent border-none cursor-pointer p-0 mb-1"
        >
          <ChevronLeft size={16} />
          {groupName}
        </button>
      </div>
      <RankingsContent
        groupName={groupName}
        rankings={{ asistencias, aportes, anfitrion }}
        destacados={destacados}
        datos={datos}
      />
    </div>
  );
}
