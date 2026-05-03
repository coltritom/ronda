"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check, Link } from "lucide-react";
import { createClient } from "@/lib/supabase/clients";
import { getOrCreateInvite } from "@/lib/actions/invites";
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

type MemberRpcItem = { user_id: string; name: string };

type EventRpcItem = {
  id: string;
  name: string;
  date: string;
  location: string | null;
  status: string;
  going: number;
  maybe: number;
  not_going: number;
  attendance_count: number;
  total_spent: number;
};

type GroupPageRpcResult = {
  error?: string;
  group?: { id: string; name: string; emoji: string };
  members?: MemberRpcItem[];
  events?: EventRpcItem[];
  pending_count?: number;
  pending_amount?: number;
  attendance_by_member?: Record<string, number>;
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
  const [groupEmoji, setGroupEmoji] = useState("🔥");
  const [members, setMembers] = useState<MemberData[]>([]);
  const [juntadas, setJuntadas] = useState<JuntadaItem[]>([]);
  const [pending, setPending] = useState<{ count: number; amount: number } | null>(null);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showAllPast, setShowAllPast] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState("");

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data, error } = await supabase.rpc("get_group_page_data", {
      p_group_id: id,
      p_user_id: user.id,
    });

    const result = data as GroupPageRpcResult | null;

    if (error || !result || result.error) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setGroupName(result.group!.name);
    setGroupEmoji(result.group!.emoji);

    const rpcMembers = result.members ?? [];
    const memberList: MemberData[] = rpcMembers.map((m, i) => ({
      name: m.name,
      colorIndex: i,
    }));
    setMembers(memberList);

    const memberCount = memberList.length;
    const mappedJuntadas: JuntadaItem[] = (result.events ?? []).map((e) => {
      const noResponse = Math.max(0, memberCount - e.going - e.maybe - e.not_going);
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
        attendees: e.attendance_count,
        totalSpent: e.total_spent,
        closed: e.status === "completed",
        confirmed: e.going,
        unsure: e.maybe,
        noResponse,
      };
    });
    setJuntadas(mappedJuntadas);

    const pendingCount = result.pending_count ?? 0;
    const pendingAmount = result.pending_amount ?? 0;
    setPending(pendingCount > 0 ? { count: pendingCount, amount: pendingAmount } : null);

    const attendanceByMember = result.attendance_by_member ?? {};
    const topMembers = rpcMembers
      .map((m, i) => ({
        user_id: m.user_id,
        name: m.name,
        count: attendanceByMember[m.user_id] ?? 0,
        colorIndex: i,
      }))
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

  const handleCopyInvite = async () => {
    setInviteError("");
    let token = inviteToken;
    if (!token) {
      const result = await getOrCreateInvite(id);
      if ("error" in result) {
        setInviteError(result.error);
        return;
      }
      token = result.token;
      setInviteToken(token);
    }
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(link).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 pt-8 flex flex-col gap-4 animate-pulse">
      <div className="h-8 w-48 rounded-xl bg-noche-media" />
      <div className="h-4 w-32 rounded-lg bg-noche-media" />
      <div className="h-32 rounded-2xl bg-noche-media" />
      <div className="h-24 rounded-2xl bg-noche-media" />
    </div>
  );

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto px-4 md:px-6 pt-8 pb-8 text-center">
        <p className="text-sm text-niebla mb-4">Grupo no encontrado.</p>
        <a href="/groups" className="text-fuego text-sm font-semibold">Ir al inicio</a>
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

  const emoji = groupEmoji;

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

        {upcomingJuntadas.length === 1 && (
          <NextJuntada
            key={upcomingJuntadas[0].id}
            juntadaId={upcomingJuntadas[0].id}
            juntadaName={upcomingJuntadas[0].name}
            date={upcomingJuntadas[0].date}
            confirmed={upcomingJuntadas[0].confirmed ?? 0}
            unsure={upcomingJuntadas[0].unsure ?? 0}
            noResponse={upcomingJuntadas[0].noResponse ?? 0}
            groupId={id}
          />
        )}

        {upcomingJuntadas.length > 1 && (
          <div className="bg-noche-media rounded-2xl p-4">
            <p className="text-[11px] text-fuego font-semibold uppercase tracking-[0.08em] mb-4">
              Próximas juntadas
            </p>
            {upcomingJuntadas.map((j, idx) => (
              <div key={j.id}>
                {idx > 0 && <div className="border-t border-white/[0.06] my-4" />}
                <NextJuntada
                  juntadaId={j.id}
                  juntadaName={j.name}
                  date={j.date}
                  confirmed={j.confirmed ?? 0}
                  unsure={j.unsure ?? 0}
                  noResponse={j.noResponse ?? 0}
                  groupId={id}
                  wrapCard={false}
                  showLabel={false}
                />
              </div>
            ))}
          </div>
        )}

        {ranking.length > 0 && <MiniRanking entries={ranking} groupId={id} />}

        <div className="bg-noche-media rounded-2xl p-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-display font-semibold text-base text-humo">Etiquetas del grupo</span>
              <p className="text-xs text-niebla mt-0.5">Auto-generadas según cómo se porta cada uno.</p>
            </div>
            <button
              onClick={() => router.push(`/groups/${id}/etiquetas`)}
              className="bg-transparent border-none text-fuego font-semibold text-xs cursor-pointer p-0 shrink-0 ml-3"
            >
              Ver →
            </button>
          </div>
        </div>

        {pastJuntadas.length > 0 && (
          <div className="flex justify-between items-center mt-1">
            <span className="font-display font-semibold text-base text-humo">
              Últimas juntadas
            </span>
            <button
              onClick={() => router.push(`/groups/${id}/historial`)}
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
          {inviteError && (
            <p className="text-xs text-error mt-2">{inviteError}</p>
          )}
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
