"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Minus, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/clients";

type RSVPStatus = "going" | "not_going" | "maybe" | "none";

interface NextJuntadaProps {
  date: string;
  confirmed: number;
  unsure: number;
  noResponse: number;
  juntadaId?: string;
  juntadaName?: string;
  groupId?: string;
  wrapCard?: boolean;
  showLabel?: boolean;
}

const CHIPS: {
  id: Exclude<RSVPStatus, "none">;
  label: string;
  icon: typeof Check;
  activeClasses: string;
  iconColor: string;
  bgConfirmed: string;
}[] = [
  {
    id: "going", label: "Voy", icon: Check,
    activeClasses: "bg-menta/[0.15] ring-1 ring-menta/40",
    iconColor: "text-menta", bgConfirmed: "bg-menta/20",
  },
  {
    id: "not_going", label: "No voy", icon: X,
    activeClasses: "bg-error/[0.12] ring-1 ring-error/30",
    iconColor: "text-error", bgConfirmed: "bg-error/15",
  },
  {
    id: "maybe", label: "No sé", icon: Minus,
    activeClasses: "bg-niebla/[0.15] ring-1 ring-niebla/40",
    iconColor: "text-niebla", bgConfirmed: "bg-niebla/15",
  },
];

export function NextJuntada({
  date, confirmed, unsure, noResponse,
  juntadaId, juntadaName, groupId,
  wrapCard = true, showLabel = true,
}: NextJuntadaProps) {
  const router = useRouter();
  const [status, setStatus] = useState<RSVPStatus>("none");

  useEffect(() => {
    if (!juntadaId) return;
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("event_rsvps")
        .select("response")
        .eq("event_id", juntadaId)
        .eq("user_id", user.id)
        .single();
      if (data?.response) setStatus(data.response as RSVPStatus);
    });
  }, [juntadaId]);

  const handleRSVP = async (newStatus: RSVPStatus) => {
    setStatus(newStatus);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !juntadaId) return;

    if (newStatus === "none") {
      await supabase
        .from("event_rsvps")
        .delete()
        .eq("event_id", juntadaId)
        .eq("user_id", user.id);
    } else {
      await supabase.from("event_rsvps").upsert(
        { event_id: juntadaId, user_id: user.id, response: newStatus },
        { onConflict: "event_id,user_id" }
      );
    }
  };

  const goToDetail = () => {
    if (!juntadaId || !groupId) return;
    router.push(`/groups/${groupId}/events/${juntadaId}`);
  };

  const currentChip = CHIPS.find((c) => c.id === status);

  const getUpdatedCounts = () => {
    const c = confirmed + (status === "going" ? 1 : 0);
    const u = unsure + (status === "maybe" ? 1 : 0);
    const n = Math.max(0, noResponse - 1);
    return { c, u, n };
  };

  const header = (
    <div className={`flex items-start ${showLabel ? "justify-between" : "justify-end"} mb-1.5`}>
      {showLabel && (
        <p className="text-[11px] text-fuego font-semibold uppercase tracking-[0.08em]">
          Próxima juntada
        </p>
      )}
      {juntadaId && (
        <button
          onClick={goToDetail}
          className="flex items-center gap-0.5 text-xs text-fuego font-semibold bg-transparent border-none cursor-pointer"
        >
          Ver detalle <ChevronRight size={13} />
        </button>
      )}
    </div>
  );

  const nameDate = (
    <>
      {juntadaName && (
        <p className="font-display font-semibold text-[17px] text-humo">{juntadaName}</p>
      )}
      <p className={juntadaName ? "text-[13px] text-niebla" : "font-display font-semibold text-[17px] text-humo"}>
        {date}
      </p>
    </>
  );

  let inner: React.ReactNode;

  if (status !== "none" && currentChip) {
    const { c, u, n } = getUpdatedCounts();
    const Icon = currentChip.icon;
    const confirmLabel =
      status === "going" ? "Confirmaste que vas"
      : status === "not_going" ? "No vas a ir"
      : "Todavía no sabés";

    inner = (
      <>
        {header}
        {nameDate}
        <p className="text-[13px] text-niebla mt-1 mb-3">
          {c} van{u > 0 ? ` · ${u} no sabe${u > 1 ? "n" : ""}` : ""}{n > 0 ? ` · ${n} sin respuesta` : ""}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentChip.bgConfirmed}`}>
              <Icon size={16} className={currentChip.iconColor} strokeWidth={2.5} />
            </div>
            <span className="text-sm font-medium text-humo">{confirmLabel}</span>
          </div>
          <button
            onClick={() => handleRSVP("none")}
            className="text-xs text-fuego font-semibold bg-transparent border-none cursor-pointer"
          >
            Cambiar
          </button>
        </div>
      </>
    );
  } else {
    inner = (
      <>
        {header}
        {nameDate}
        <p className="text-[13px] text-niebla mt-1 mb-3">
          {confirmed} van
          {unsure > 0 ? ` · ${unsure} no sabe${unsure > 1 ? "n" : ""}` : ""}
          {" "}· {noResponse} sin respuesta
        </p>
        <div className="flex gap-2">
          {CHIPS.map((chip) => {
            const Icon = chip.icon;
            return (
              <button
                key={chip.id}
                onClick={() => handleRSVP(chip.id)}
                className="
                  flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-sm font-semibold
                  border-none cursor-pointer transition-all
                  bg-white/5 text-niebla
                  hover:bg-white/10 active:scale-[0.97]
                "
              >
                <Icon size={15} strokeWidth={2.5} />
                {chip.label}
              </button>
            );
          })}
        </div>
      </>
    );
  }

  if (!wrapCard) return <>{inner}</>;
  return <div className="bg-noche-media rounded-2xl p-4">{inner}</div>;
}
