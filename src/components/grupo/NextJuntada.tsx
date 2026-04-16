"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Minus, ChevronRight } from "lucide-react";
import { LUGAR_OPTIONS } from "@/lib/constants";
import { getRSVP, setRSVP, type RSVPStatus } from "@/lib/store";

interface NextJuntadaProps {
  date: string;
  confirmed: number;
  unsure: number;
  noResponse: number;
  juntadaId?: string;
  juntadaName?: string;
  lugarId?: string;
  hostName?: string;
  isoDate?: string;
}

const CHIPS: { id: RSVPStatus; label: string; icon: typeof Check; activeClasses: string; iconColor: string; bgConfirmed: string }[] = [
  {
    id: "voy", label: "Voy", icon: Check,
    activeClasses: "bg-menta/[0.15] ring-1 ring-menta/40",
    iconColor: "text-menta", bgConfirmed: "bg-menta/20",
  },
  {
    id: "no-voy", label: "No voy", icon: X,
    activeClasses: "bg-error/[0.12] ring-1 ring-error/30",
    iconColor: "text-error", bgConfirmed: "bg-error/15",
  },
  {
    id: "no-se", label: "No sé", icon: Minus,
    activeClasses: "bg-niebla/[0.15] ring-1 ring-niebla/40",
    iconColor: "text-niebla", bgConfirmed: "bg-niebla/15",
  },
];

export function NextJuntada({ date, confirmed, unsure, noResponse, juntadaId, juntadaName, lugarId, hostName, isoDate }: NextJuntadaProps) {
  const router = useRouter();

  const goToDetail = () => {
    if (!juntadaId) return;
    const params = new URLSearchParams();
    if (juntadaName) params.set("n", juntadaName);
    if (date) params.set("d", date);
    if (isoDate) params.set("iso", isoDate);
    if (lugarId) {
      const lugarOption = LUGAR_OPTIONS.find((l) => l.id === lugarId);
      if (lugarOption) {
        const lugarDisplay = hostName
          ? `${lugarOption.emoji} En lo de ${hostName}`
          : `${lugarOption.emoji} ${lugarOption.label}`;
        params.set("l", lugarDisplay);
      }
    }
    router.push(`/juntada/${juntadaId}?${params.toString()}`);
  };
  const [status, setStatus] = useState<RSVPStatus>(() => getRSVP(juntadaId ?? ""));

  const currentChip = CHIPS.find((c) => c.id === status);

  const getUpdatedCounts = () => {
    const c = confirmed + (status === "voy" ? 1 : 0);
    const u = unsure + (status === "no-se" ? 1 : 0);
    const n = Math.max(0, noResponse - 1);
    return { c, u, n };
  };

  if (status !== "none" && currentChip) {
    const { c, u, n } = getUpdatedCounts();
    const Icon = currentChip.icon;
    const confirmLabel = status === "voy" ? "Confirmaste que vas" : status === "no-voy" ? "No vas a ir" : "Todavía no sabés";

    return (
      <div className="bg-noche-media rounded-2xl p-4">
        <div className="flex items-start justify-between mb-1.5">
          <p className="text-[11px] text-fuego font-semibold uppercase tracking-[0.08em]">
            Próxima juntada
          </p>
          {juntadaId && (
            <button
              onClick={goToDetail}
              className="flex items-center gap-0.5 text-xs text-fuego font-semibold bg-transparent border-none cursor-pointer"
            >
              Ver detalle <ChevronRight size={13} />
            </button>
          )}
        </div>
        {juntadaName && <p className="font-display font-semibold text-[17px] text-humo">{juntadaName}</p>}
        <p className={`font-${juntadaName ? "normal text-[13px] text-niebla" : "display font-semibold text-[17px] text-humo"}`}>{date}</p>
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
            onClick={() => { setStatus("none"); setRSVP(juntadaId ?? "", "none"); }}
            className="text-xs text-fuego font-semibold bg-transparent border-none cursor-pointer"
          >
            Cambiar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-noche-media rounded-2xl p-4">
      <div className="flex items-start justify-between mb-1.5">
        <p className="text-[11px] text-fuego font-semibold uppercase tracking-[0.08em]">
          Próxima juntada
        </p>
        {juntadaId && (
          <button
            onClick={goToDetail}
            className="flex items-center gap-0.5 text-xs text-fuego font-semibold bg-transparent border-none cursor-pointer"
          >
            Ver detalle <ChevronRight size={13} />
          </button>
        )}
      </div>
      {juntadaName && <p className="font-display font-semibold text-[17px] text-humo">{juntadaName}</p>}
      <p className={juntadaName ? "text-[13px] text-niebla" : "font-display font-semibold text-[17px] text-humo"}>{date}</p>
      <p className="text-[13px] text-niebla mt-1 mb-3">
        {confirmed} van{unsure > 0 ? ` · ${unsure} no sabe${unsure > 1 ? "n" : ""}` : ""} · {noResponse} sin respuesta
      </p>

      <div className="flex gap-2">
        {CHIPS.map((chip) => {
          const Icon = chip.icon;
          return (
            <button
              key={chip.id}
              onClick={() => { setStatus(chip.id); setRSVP(juntadaId ?? "", chip.id); }}
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
    </div>
  );
}
