"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Share2 } from "lucide-react";
import { ShareStoryModal } from "@/components/share/ShareStoryModal";
import { StoryResumen } from "@/components/share/StoryResumen";

export interface WrappedCardProps {
  groupName: string;
  year: number;
  totalJuntadas: number;
  totalSies: number;
  topPresente: string;
  topFantasma: string;
  fantasmaFaltas: number;
  topMisterioso: string;
  topMisteriosoDetalle: string;
  topSede: string;
  sedeVeces: number;
  onJuntadasClick?: () => void;
}

const AWARDS = (props: WrappedCardProps) => [
  { icon: "🏆", label: "El Presente",     value: props.topPresente,   detail: null },
  { icon: "👻", label: "El Fantasma",     value: props.topFantasma,   detail: `faltó ${props.fantasmaFaltas}` },
  { icon: "⏳", label: "El Misterioso",   value: props.topMisterioso, detail: props.topMisteriosoDetalle },
  { icon: "🏠", label: "La Sede Oficial", value: props.topSede,       detail: `puso la casa ${props.sedeVeces} veces` },
];

export function WrappedCard(props: WrappedCardProps) {
  const { groupName, year, totalJuntadas, totalSies, onJuntadasClick } = props;
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <>
      <div className="bg-noche-media rounded-2xl p-5 relative overflow-hidden">
        {/* Glow deco */}
        <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-fuego/[0.07] blur-[50px] pointer-events-none" />

        {/* Header */}
        <div className="relative mb-4">
          <p className="text-[10px] font-bold text-fuego uppercase tracking-[2px] mb-1">
            El año del grupo
          </p>
          <p className="font-display font-bold text-xl text-humo leading-tight">
            {groupName}
          </p>
          <button
            onClick={onJuntadasClick}
            disabled={!onJuntadasClick}
            className="mt-1 text-[13px] text-niebla bg-transparent border-none p-0 cursor-pointer disabled:cursor-default hover:text-humo transition-colors text-left"
          >
            📅 {totalJuntadas} juntadas registradas{onJuntadasClick && <span className="text-fuego"> →</span>}
          </button>
        </div>

        {/* Métrica principal */}
        <div className="bg-noche rounded-2xl px-4 py-5 mb-4 relative text-center border border-white/[0.05]">
          <p className="text-[10px] font-bold text-niebla uppercase tracking-[2px] mb-3">
            Confirmaciones &apos;Voy&apos;
          </p>
          <p className="font-display font-black text-[72px] leading-none text-humo">
            {totalSies}
          </p>
          <p className="text-[12px] text-niebla mt-2">
            Total de síes que dieron en el año
          </p>
        </div>

        {/* Premios */}
        <div className="flex flex-col divide-y divide-white/[0.05]">
          {AWARDS(props).map(({ icon, label, value, detail }) => (
            <div key={label} className="flex items-center gap-3 py-2.5">
              <span className="text-lg w-7 text-center shrink-0">{icon}</span>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] text-niebla block leading-tight">{label}</span>
                <span className="text-[14px] font-semibold text-humo leading-tight">{value}</span>
              </div>
              {detail && (
                <span className="text-[12px] text-niebla shrink-0 text-right max-w-[130px] leading-snug">
                  {detail}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-4">
          <Button primary={false} full onClick={() => setShareOpen(true)}>
            <Share2 size={14} />
            Compartir resumen
          </Button>
        </div>
      </div>

      <ShareStoryModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        filename={`ronda-resumen-${groupName.toLowerCase().replace(/\s+/g, "-")}`}
      >
        <StoryResumen {...props} />
      </ShareStoryModal>
    </>
  );
}
