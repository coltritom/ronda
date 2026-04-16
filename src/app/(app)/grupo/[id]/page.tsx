"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check, Link } from "lucide-react";
import { MOCK_MEMBERS, MOCK_GROUPS, MOCK_GROUP_DETAILS, type JuntadaItem } from "@/lib/constants";
import { addJuntada, getNewJuntadas } from "@/lib/store";
import { GroupHeader } from "@/components/grupo/GroupHeader";
import { PendingAlert } from "@/components/grupo/PendingAlert";
import { NextJuntada } from "@/components/grupo/NextJuntada";
import { MiniRanking } from "@/components/grupo/MiniRanking";
import { JuntadaCard } from "@/components/juntada/JuntadaCard";
import { Button } from "@/components/ui/Button";
import { FAB } from "@/components/ui/FAB";
import { CreateJuntadaSheet } from "@/components/juntada/CreateJuntadaSheet";
import { WrappedCard } from "@/components/grupo/WrappedCard";

export default function GrupoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [extraJuntadas, setExtraJuntadas] = useState<JuntadaItem[]>(() => getNewJuntadas(id));
  const [copied, setCopied] = useState(false);

  const handleCopyInvite = () => {
    const link = `${window.location.origin}/invite/${id}`;
    navigator.clipboard.writeText(link).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const group = MOCK_GROUPS.find((g) => g.id === id) ?? MOCK_GROUPS[0];
  const detail = MOCK_GROUP_DETAILS[id] ?? MOCK_GROUP_DETAILS["g1"];
  const allJuntadas = [...extraJuntadas, ...detail.juntadas];

  const TODAY = new Date().toISOString().slice(0, 10);
  const upcomingJuntadas = allJuntadas
    .filter((j) => j.isoDate >= TODAY)
    .sort((a, b) => a.isoDate.localeCompare(b.isoDate));
  const pastJuntadas = allJuntadas
    .filter((j) => j.isoDate < TODAY)
    .sort((a, b) => b.isoDate.localeCompare(a.isoDate));

  const handleJuntadaCreated = (j: any) => {
    // Formatear la fecha corta para mostrar en JuntadaCard
    let displayDate = j.date ?? "";
    if (displayDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [y, m, d] = displayDate.split("-").map(Number);
      displayDate = new Date(y, m - 1, d).toLocaleDateString("es-AR", {
        weekday: "short", day: "numeric", month: "short",
      });
    }
    const isoDate = typeof j.date === "string" && j.date.match(/^\d{4}-\d{2}-\d{2}$/)
      ? j.date
      : new Date().toISOString().slice(0, 10);
    const entry: JuntadaItem = {
      id: j.id,
      isoDate,
      date: displayDate,
      name: j.name || "Juntada nueva",
      attendees: 0,
      totalSpent: 0,
      closed: false,
      lugarId: j.lugar ?? undefined,
      hostName: j.hostName ?? undefined,
      confirmed: 0,
      unsure: 0,
      noResponse: 0,
    };
    addJuntada(id, entry);
    setExtraJuntadas([...getNewJuntadas(id)]);
  };

  return (
    <div className="max-w-2xl mx-auto pb-8">
      <GroupHeader
        groupId={id}
        name={group.name}
        emoji={group.emoji}
        members={MOCK_MEMBERS}
      />

      <div className="px-4 md:px-6 flex flex-col gap-3">
        {detail.pending && (
          <PendingAlert count={detail.pending.count} amount={detail.pending.amount} groupId={id} />
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
            lugarId={j.lugarId}
            hostName={j.hostName}
          />
        ))}

        <MiniRanking entries={detail.ranking} groupId={id} />

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

        {allJuntadas.length === 0 && (
          <p className="text-sm text-niebla text-center py-4">
            Todavía no hay juntadas. ¡Creá la primera!
          </p>
        )}

        {pastJuntadas.map((j) => (
          <JuntadaCard key={j.id} id={j.id} date={j.date} name={j.name} attendees={j.attendees} totalSpent={j.totalSpent} closed={j.closed} lugarId={j.lugarId} hostName={j.hostName} />
        ))}

        <div className="bg-noche-media rounded-2xl p-4 text-center mt-1">
          <p className="text-sm text-niebla mb-3">
            Sumá gente al grupo para que la próxima juntada sea mejor.
          </p>
          <Button primary={false} onClick={handleCopyInvite}>
            {copied ? <Check size={15} /> : <Link size={15} />}
            {copied ? "Link copiado. Mandalo al grupo." : "Copiar link de invitación"}
          </Button>
        </div>

        {detail.wrapped && (
          <WrappedCard
            groupName={group.name}
            year={2026}
            totalJuntadas={detail.wrapped.totalJuntadas}
            totalSpent={detail.wrapped.totalSpent}
            topPresente={detail.wrapped.topPresente}
            topFantasma={detail.wrapped.topFantasma}
            fantasmaFaltas={detail.wrapped.fantasmaFaltas}
          />
        )}
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
        onClose={() => setSheetOpen(false)}
        groupId={id}
        onCreated={handleJuntadaCreated}
      />
    </div>
  );
}
