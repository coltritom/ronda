"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check, Link } from "lucide-react";
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
import type { RSVPStatus } from "@/components/grupo/NextJuntada";

const PAST_PREVIEW = 3;

export interface RankingEntry {
  emoji: string;
  label: string;
  name: string;
  detail: string;
  memberEmoji: string;
  memberColorIndex: number;
  variant: "ambar" | "uva" | "rosa";
}

export interface MemberData {
  emoji?: string;
  name: string;
  colorIndex?: number;
}

interface GrupoPageClientProps {
  groupId: string;
  groupName: string;
  groupEmoji: string;
  members: MemberData[];
  juntadas: JuntadaItem[];
  pending: { count: number; amount: number } | null;
  ranking: RankingEntry[];
  rsvpByEvent: Record<string, string>;
  userId: string;
}

export function GrupoPageClient({
  groupId, groupName, groupEmoji, members, juntadas, pending, ranking, rsvpByEvent, userId,
}: GrupoPageClientProps) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showAllPast, setShowAllPast] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState("");
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
  }, []);

  const handleCopyInvite = async () => {
    setInviteError("");
    let token = inviteToken;
    if (!token) {
      const result = await getOrCreateInvite(groupId);
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
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
  };

  const TODAY = new Date().toISOString().slice(0, 10);
  const upcomingJuntadas = juntadas
    .filter((j) => j.isoDate >= TODAY)
    .sort((a, b) => a.isoDate.localeCompare(b.isoDate));
  const pastJuntadas = juntadas
    .filter((j) => j.isoDate < TODAY)
    .sort((a, b) => b.isoDate.localeCompare(a.isoDate));

  return (
    <div className="max-w-2xl mx-auto pb-8">
      <GroupHeader
        groupId={groupId}
        name={groupName}
        emoji={groupEmoji}
        members={members}
      />

      <div className="px-4 md:px-6 flex flex-col gap-3">
        {pending && (
          <PendingAlert count={pending.count} amount={pending.amount} groupId={groupId} />
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
            groupId={groupId}
            userId={userId}
            initialRsvp={(rsvpByEvent[upcomingJuntadas[0].id] ?? "none") as RSVPStatus}
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
                  groupId={groupId}
                  wrapCard={false}
                  showLabel={false}
                  userId={userId}
                  initialRsvp={(rsvpByEvent[j.id] ?? "none") as RSVPStatus}
                />
              </div>
            ))}
          </div>
        )}

        {ranking.length > 0 && <MiniRanking entries={ranking} groupId={groupId} />}

        <div className="bg-noche-media rounded-2xl p-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-display font-semibold text-base text-humo">Etiquetas del grupo</span>
              <p className="text-xs text-niebla mt-0.5">Auto-generadas según cómo se porta cada uno.</p>
            </div>
            <button
              onClick={() => router.push(`/groups/${groupId}/etiquetas`)}
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
              onClick={() => router.push(`/groups/${groupId}/historial`)}
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
            groupId={groupId}
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
        onClose={() => { setSheetOpen(false); router.refresh(); }}
        groupId={groupId}
        groupName={groupName}
        onCreated={() => {}}
      />
    </div>
  );
}
