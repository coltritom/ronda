"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Share2 } from "lucide-react";
import { ShareStoryModal } from "@/components/share/ShareStoryModal";
import { StoryResumen } from "@/components/share/StoryResumen";

interface WrappedCardProps {
  groupName: string;
  year: number;
  totalJuntadas: number;
  totalSpent: number;
  topPresente: string;
  topFantasma: string;
  fantasmaFaltas: number;
  onJuntadasClick?: () => void;
}

export function WrappedCard({
  groupName, year, totalJuntadas, totalSpent,
  topPresente, topFantasma, fantasmaFaltas, onJuntadasClick,
}: WrappedCardProps) {
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <>
      <div className="bg-noche-media rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-fuego/[0.06] blur-[40px] pointer-events-none" />

        <div className="flex items-center justify-between mb-4 relative">
          <div>
            <p className="text-[11px] text-fuego font-semibold uppercase tracking-wider">
              {groupName} — {year}
            </p>
            <p className="font-display font-bold text-lg text-humo mt-0.5">
              El año del grupo
            </p>
          </div>
          <span className="text-2xl">📊</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 relative">
          <button
            onClick={onJuntadasClick}
            disabled={!onJuntadasClick}
            className="bg-noche rounded-xl p-3 text-center border-none w-full disabled:cursor-default cursor-pointer group transition-opacity hover:opacity-80 disabled:hover:opacity-100"
          >
            <p className="font-display font-bold text-2xl text-humo">{totalJuntadas}</p>
            <p className="text-[11px] text-niebla">
              juntadas{onJuntadasClick && <span className="text-fuego"> →</span>}
            </p>
          </button>
          <div className="bg-noche rounded-xl p-3 text-center">
            <p className="font-display font-bold text-2xl text-humo">
              ${(totalSpent / 1000).toFixed(0)}k
            </p>
            <p className="text-[11px] text-niebla">gastados</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 mb-4 relative">
          <div className="flex items-center justify-between py-1.5">
            <span className="text-sm text-niebla">🏆 Más presente</span>
            <span className="text-sm font-semibold text-humo">{topPresente}</span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-t border-white/[0.04]">
            <span className="text-sm text-niebla">👻 Fantasma del año</span>
            <span className="text-sm font-semibold text-humo">
              {topFantasma} (faltó {fantasmaFaltas})
            </span>
          </div>
        </div>

        <div className="relative">
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
        <StoryResumen
          groupName={groupName}
          year={year}
          totalJuntadas={totalJuntadas}
          totalSpent={totalSpent}
          topPresente={topPresente}
          topFantasma={topFantasma}
          fantasmaFaltas={fantasmaFaltas}
        />
      </ShareStoryModal>
    </>
  );
}
