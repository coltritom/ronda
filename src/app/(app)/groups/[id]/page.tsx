import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GrupoPageClient, type RankingEntry, type MemberData } from "@/components/grupo/GrupoPageClient";
import type { JuntadaItem } from "@/lib/constants";

type MemberRpcItem = { user_id: string; name: string }
type EventRpcItem = {
  id: string; name: string; date: string; location: string | null; status: string
  going: number; maybe: number; not_going: number
  attendance_count: number; total_spent: number
}
type GroupPageRpcResult = {
  error?: string
  group?: { id: string; name: string; emoji: string }
  members?: MemberRpcItem[]
  events?: EventRpcItem[]
  pending_count?: number
  pending_amount?: number
  attendance_by_member?: Record<string, number>
}

const RANK_EMOJIS  = ["🏆", "🥈", "🥉"]
const RANK_LABELS  = ["El Presente", "El Constante", "El Fiel"]
const RANK_VARIANTS = ["ambar", "uva", "rosa"] as const

export default async function GrupoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rpcData, error } = await supabase.rpc("get_group_page_data", {
    p_group_id: id,
    p_user_id:  user.id,
  });

  const result = rpcData as GroupPageRpcResult | null;

  if (error || !result || result.error) {
    return (
      <div className="max-w-2xl mx-auto px-4 md:px-6 pt-8 pb-8 text-center">
        <p className="text-sm text-niebla mb-4">Grupo no encontrado.</p>
        <a href="/groups" className="text-fuego text-sm font-semibold">Ir al inicio</a>
      </div>
    );
  }

  const rpcMembers = result.members ?? [];
  const memberList: MemberData[] = rpcMembers.map((m, i) => ({
    name: m.name,
    colorIndex: i,
  }));

  const memberCount = memberList.length;
  const TODAY = new Date().toISOString().slice(0, 10);

  const mappedJuntadas: JuntadaItem[] = (result.events ?? []).map((e) => {
    const noResponse = Math.max(0, memberCount - e.going - e.maybe - e.not_going);
    const formattedDate = new Intl.DateTimeFormat("es-AR", {
      weekday: "short", day: "numeric", month: "short",
      timeZone: "America/Argentina/Buenos_Aires",
    }).format(new Date(e.date));
    return {
      id: e.id, isoDate: e.date.slice(0, 10), date: formattedDate, name: e.name,
      attendees: e.attendance_count, totalSpent: e.total_spent,
      closed: e.status === "completed", confirmed: e.going, unsure: e.maybe, noResponse,
    };
  });

  const upcomingIds = mappedJuntadas
    .filter((j) => j.isoDate >= TODAY)
    .map((j) => j.id);

  const rsvpByEvent: Record<string, string> = {};
  if (upcomingIds.length > 0) {
    const { data: rsvps } = await supabase
      .from("event_rsvps")
      .select("event_id, response")
      .in("event_id", upcomingIds)
      .eq("user_id", user.id);
    for (const r of rsvps ?? []) {
      rsvpByEvent[r.event_id] = r.response;
    }
  }

  const pendingCount  = result.pending_count  ?? 0;
  const pendingAmount = result.pending_amount ?? 0;
  const pending = pendingCount > 0 ? { count: pendingCount, amount: pendingAmount } : null;

  const attendanceByMember = result.attendance_by_member ?? {};
  const topMembers = rpcMembers
    .map((m, i) => ({ ...m, count: attendanceByMember[m.user_id] ?? 0, colorIndex: i }))
    .filter((m) => m.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const ranking: RankingEntry[] = topMembers.map((m, i) => ({
    emoji:            RANK_EMOJIS[i],
    label:            RANK_LABELS[i],
    name:             m.name,
    detail:           `${m.count} juntada${m.count !== 1 ? "s" : ""}`,
    memberEmoji:      "",
    memberColorIndex: m.colorIndex,
    variant:          RANK_VARIANTS[i % 3],
  }));

  return (
    <GrupoPageClient
      groupId={id}
      groupName={result.group!.name}
      groupEmoji={result.group!.emoji}
      members={memberList}
      juntadas={mappedJuntadas}
      pending={pending}
      ranking={ranking}
      rsvpByEvent={rsvpByEvent}
      userId={user.id}
    />
  );
}
