"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check, Link } from "lucide-react";
import { createClient } from "@/lib/supabase/clients";
import { GroupHeader } from "@/components/grupo/GroupHeader";
import { PendingAlert } from "@/components/grupo/PendingAlert";
import { NextJuntada } from "@/components/grupo/NextJuntada";
import { MiniRanking } from "@/components/grupo/MiniRanking";
import { JuntadaCard } from "@/components/juntada/JuntadaCard";
import { Button } from "@/components/ui/Button";
import { FAB } from "@/components/ui/FAB";
import { CreateJuntadaSheet } from "@/components/juntada/CreateJuntadaSheet";
import type { JuntadaItem } from "@/lib/constants";

type RankingEntry = {
  emoji: string;
  label: string;
  name: string;
  detail: string;
  memberEmoji: string;
  memberColorIndex: number;
  variant: "ambar" | "uva" | "rosa";
};

type MemberData = {
  emoji?: string;
  name: string;
  colorIndex?: number;
};

const RANK_EMOJIS = ["🏆", "🥈", "🥉"];
const RANK_LABELS = ["El Presente", "El Constante", "El Fiel"];
const RANK_VARIANTS = ["ambar", "uva", "rosa"] as const;
const PAST_PREVIEW = 3;

export default function GrupoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState<MemberData[]>([]);
  const [juntadas, setJuntadas] = useState<JuntadaItem[]>([]);
  const [pending, setPending] = useState<{ count: number; amount: number } | null>(null);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showAllPast, setShowAllPast] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    // Verificar membresía
    const { data: membership } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", id)
      .eq("user_id", user.id)
      .single();

    // Datos del grupo
    const { data: groupData } = await supabase
      .from("groups")
      .select("id, name")
      .eq("id", id)
      .single();

    if (!groupData || !membership) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setGroupName(groupData.name);

    // Integrantes
    const { data: membersRaw } = await supabase
      .from("group_members")
      .select("user_id, profiles ( name )")
      .eq("group_id", id);

    const memberList: MemberData[] = (membersRaw ?? []).map((m, i) => {
      const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
      return { name: (p as { name: string } | null)?.name ?? "Usuario", colorIndex: i };
    });
    setMembers(memberList);

    // Eventos del grupo
    const { data: eventsRaw } = await supabase
      .from("events")
      .select("id, name, date, location, status, event_rsvps ( response )")
      .eq("group_id", id)
      .neq("status", "cancelled")
      .order("date", { ascending: true });

    const eventIds = (eventsRaw ?? []).map((e) => e.id);

    // Asistencia por evento y por miembro
    const { data: attendanceRaw } = eventIds.length > 0
      ? await supabase.from("event_attendance").select("event_id, user_id").in("event_id", eventIds)
      : { data: [] };

    const attendanceByEvent: Record<string, number> = {};
    const attendanceByMember: Record<string, number> = {};
    for (const a of attendanceRaw ?? []) {
      attendanceByEvent[a.event_id] = (attendanceByEvent[a.event_id] ?? 0) + 1;
      attendanceByMember[a.user_id] = (attendanceByMember[a.user_id] ?? 0) + 1;
    }

    // Gastos por evento
    const { data: expensesRaw } = eventIds.length > 0
      ? await supabase.from("expenses").select("id, event_id, amount").in("event_id", eventIds)
      : { data: [] };

    const spentByEvent: Record<string, number> = {};
    const allExpenseIds: string[] = [];
    for (const e of expensesRaw ?? []) {
      spentByEvent[e.event_id] = (spentByEvent[e.event_id] ?? 0) + (e.amount ?? 0);
      allExpenseIds.push(e.id);
    }

    // Splits pendientes del usuario
    const { data: pendingSplits } = allExpenseIds.length > 0
      ? await supabase
          .from("expense_splits")
          .select("amount")
          .eq("user_id", user.id)
          .eq("is_settled", false)
          .in("expense_id", allExpenseIds)
      : { data: [] };

    const pendingAmount = (pendingSplits ?? []).reduce((sum, s) => sum + (s.amount ?? 0), 0);
    const pendingCount = (pendingSplits ?? []).length;
    setPending(pendingCount > 0 ? { count: pendingCount, amount: pendingAmount } : null);

    // Mapear eventos → JuntadaItem
    const memberCount = memberList.length;
    const mappedJuntadas: JuntadaItem[] = (eventsRaw ?? []).map((e) => {
      const rsvps = (e.event_rsvps as { response: string }[]) ?? [];
      const going = rsvps.filter((r) => r.response === "going").length;
      const maybe = rsvps.filter((r) => r.response === "maybe").length;
      const declined = rsvps.filter((r) => r.response === "not_going").length;
      const noResponse = Math.max(0, memberCount - going - maybe - declined);

      const formattedDate = new Intl.DateTimeFormat("es-AR", {
        weekday: "short",
        day: "numeric",
        month: "short",
        timeZone: "America/Argentina/Buenos_Aires",
      }).format(new Date(e.date));

      return {
        id: e.id,
        isoDate: e.date.slice(0, 10),
        date: formattedDate,
        name: e.name,
        attendees: attendanceByEvent[e.id] ?? 0,
        totalSpent: spentByEvent[e.id] ?? 0,
        closed: e.status === "completed",
        confirmed: going,
        unsure: maybe,
        noResponse,
      };
    });
    setJuntadas(mappedJuntadas);

    // Ranking top 3 por asistencia
    const topMembers = (membersRaw ?? [])
      .map((m, i) => {
        const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
        return {
          user_id: m.user_id,
          name: (p as { name: string } | null)?.name ?? "Usuario",
          count: attendanceByMember[m.user_id] ?? 0,
          colorIndex: i,
        };
      })
      .filter((m) => m.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    setRanking(
      topMembers.map((m, i) => ({
        emoji: RANK_EMOJIS[i],
        label: RANK_LABELS[i],
        name: m.name,
        detail: `${m.count} juntada${m.count !== 1 ? "s" : ""}`,
        memberEmoji: "",
        memberColorIndex: m.colorIndex,
        variant: RANK_VARIANTS[i % 3],
      }))
    );

    setLoading(false);
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  const handleCopyInvite = () => {
    const link = `${window.location.origin}/invite/${id}`;
    navigator.clipboard.writeText(link).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return null;

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto px-4 md:px-6 pt-8 pb-8 text-center">
        <p className="text-sm text-niebla mb-4">Grupo no encontrado.</p>
        <a href="/grupos" className="text-fuego text-sm font-semibold">Ir al inicio</a>
      </div>
    );
  }

  const TODAY = new Date().toISOString().slice(0, 10);
  const upcomingJuntadas = juntadas
    .filter((j) => j.isoDate >= TODAY)
    .sort((a, b) => a.isoDate.localeCompare(b.isoDate));
  const pastJuntadas = juntadas
    .filter((j) => j.isoDate < TODAY)
    .sort((a, b) => b.isoDate.localeCompare(a.isoDate));

  const emoji = groupName.charAt(0).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto pb-8">
      <GroupHeader
        groupId={id}
        name={groupName}
        emoji={emoji}
        members={members}
      />

      <div className="px-4 md:px-6 flex flex-col gap-3">
        {pending && (
          <PendingAlert count={pending.count} amount={pending.amount} groupId={id} />
        )}

        {upcomingJuntadas.map((j) => (
          <NextJuntada
            key={j.id}
            juntadaId={j.id}
            juntadaName={j.name}
            date={j.date}
            isoDate={j.isoDate}
            confirmed={j.confirmed ?? 0}
            unsure={j.unsure ?? 0}
            noResponse={j.noResponse ?? 0}
            groupId={id}
            groupName={groupName}
          />
        ))}

        {ranking.length > 0 && <MiniRanking entries={ranking} groupId={id} />}

        {pastJuntadas.length > 0 && (
          <div className="flex justify-between items-center mt-1">
            <span className="font-display font-semibold text-base text-humo">
              Últimas juntadas
            </span>
            <button
              onClick={() => router.push(`/grupo/${id}/historial`)}
              className="bg-transparent border-none text-fuego font-semibold text-xs cursor-pointer p-0"
            >
              Historial →
            </button>
          </div>
        )}

        {juntadas.length === 0 && (
          <p className="text-sm text-niebla text-center py-4">
            Todavía no hay juntadas. ¡Creá la primera!
          </p>
        )}

        {(showAllPast ? pastJuntadas : pastJuntadas.slice(0, PAST_PREVIEW)).map((j) => (
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
        ))}

        {!showAllPast && pastJuntadas.length > PAST_PREVIEW && (
          <button
            onClick={() => setShowAllPast(true)}
            className="w-full py-3 text-sm font-semibold text-fuego bg-transparent border-none cursor-pointer text-center"
          >
            Ver todas ({pastJuntadas.length}) →
          </button>
        )}

        <div className="bg-noche-media rounded-2xl p-4 text-center mt-1">
          <p className="text-sm text-niebla mb-3">
            Sumá gente al grupo para que la próxima juntada sea mejor.
          </p>
          <Button primary={false} onClick={handleCopyInvite}>
            {copied ? <Check size={15} /> : <Link size={15} />}
            {copied ? "Link copiado. Mandalo al grupo." : "Copiar link de invitación"}
          </Button>
        </div>
      </div>

      <FAB label="Nueva juntada" onClick={() => setSheetOpen(true)} />

      <div className="hidden md:block fixed bottom-6 right-8 z-40">
        <Button big onClick={() => setSheetOpen(true)}>
          <Plus size={18} />
          Nueva juntada
        </Button>
      </div>

      <CreateJuntadaSheet
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); load(); }}
        groupId={id}
        groupName={groupName}
        onCreated={() => {}}
      />
    </div>
  );
}
