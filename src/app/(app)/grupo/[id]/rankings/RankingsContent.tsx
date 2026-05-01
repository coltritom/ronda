"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";
import { Share2, ChevronDown } from "lucide-react";
import { ShareStoryModal } from "@/components/share/ShareStoryModal";
import { StoryRanking } from "@/components/share/StoryRanking";

type RankingType = "asistencias" | "aportes" | "anfitrion";

export interface RankedMember {
  name: string;
  colorIndex: number;
  score: string;
}

export interface BadgeEntry {
  emoji: string;
  label: string;
  name: string;
  detail: string;
  colorIndex: number;
  variant: "ambar" | "uva" | "rosa";
}

interface RankingsContentProps {
  groupName: string;
  rankings: Record<RankingType, RankedMember[]>;
  destacados: BadgeEntry[];
  datos: BadgeEntry[];
}

const RANKING_TYPES: { id: RankingType; emoji: string; label: string }[] = [
  { id: "asistencias", emoji: "🏆", label: "Más asistencias" },
  { id: "aportes", emoji: "💰", label: "Más aportes" },
  { id: "anfitrion", emoji: "🏠", label: "Anfitrión de oro" },
];

function BadgeRow({ emoji, label, name, detail, colorIndex, variant }: BadgeEntry) {
  return (
    <div className="bg-noche-media rounded-2xl p-4">
      <div className="flex items-center gap-2.5">
        <Avatar name={name} colorIndex={colorIndex} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[15px] text-humo">{name}</p>
          <p className="text-xs text-niebla">{detail}</p>
        </div>
        <Pill color={variant}>{emoji} {label}</Pill>
      </div>
    </div>
  );
}

export default function RankingsContent({ groupName, rankings, destacados, datos }: RankingsContentProps) {
  const [active, setActive] = useState<RankingType>("asistencias");
  const [ddOpen, setDdOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const cur = RANKING_TYPES.find((r) => r.id === active)!;
  const allMembers = rankings[active] ?? [];
  const podium = allMembers.slice(0, 3).map((m, i) => ({ ...m, position: i + 1 }));
  const fullList = allMembers.slice(3).map((m, i) => ({ ...m, position: i + 4 }));

  return (
    <div className="max-w-2xl mx-auto pb-8">
      <div className="px-4 md:px-6 pt-2 pb-2">
        <h1 className="font-display font-bold text-2xl text-humo">El ranking no miente</h1>
        <p className="text-[13px] text-niebla mt-1">{groupName}</p>
      </div>

      {/* Selector */}
      <div className="px-4 md:px-6 mt-3 mb-4 relative">
        <button
          onClick={() => setDdOpen(!ddOpen)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-noche-media border-none cursor-pointer"
        >
          <span className="flex items-center gap-2 text-[15px] font-semibold text-humo">
            <span className="text-lg">{cur.emoji}</span> {cur.label}
          </span>
          <ChevronDown size={18} className={`text-niebla transition-transform ${ddOpen ? "rotate-180" : ""}`} />
        </button>
        {ddOpen && (
          <div className="absolute left-4 right-4 md:left-6 md:right-6 top-full mt-1 bg-noche-media rounded-2xl border border-white/[0.08] overflow-hidden z-10 shadow-lg">
            {RANKING_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => { setActive(t.id); setDdOpen(false); }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 text-left
                  border-none cursor-pointer text-sm transition-colors
                  ${active === t.id
                    ? "bg-fuego/10 text-fuego font-semibold"
                    : "bg-transparent text-humo hover:bg-white/5"
                  }
                `}
              >
                <span className="text-lg">{t.emoji}</span> {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Podio */}
      {podium.length > 0 ? (
        <div className="flex items-end justify-center gap-3 px-6 pt-2 pb-6">
          {podium.map((p) => {
            const isFirst = p.position === 1;
            return (
              <div key={p.position} className="text-center flex-1 flex flex-col items-center">
                {isFirst && <span className="text-sm mb-0.5">👑</span>}
                <Avatar name={p.name} colorIndex={p.colorIndex} size={isFirst ? "lg" : "md"} />
                <p className={`font-semibold text-sm mt-1.5 ${isFirst ? "text-ambar" : "text-humo"}`}>{p.name}</p>
                <p className={`text-xs mt-0.5 ${isFirst ? "text-ambar font-semibold" : "text-niebla"}`}>{p.score}</p>
                <div className={`
                  w-full mt-2 rounded-t-lg font-display font-bold
                  ${isFirst ? "bg-ambar/[0.15] border border-ambar/30 py-6 text-2xl text-ambar" : "bg-noche-media text-niebla"}
                  ${p.position === 2 ? "py-4 text-xl" : ""}
                  ${p.position === 3 ? "py-3 text-xl" : ""}
                `}>
                  {p.position}°
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-4 md:px-6 py-8 text-center">
          <p className="text-sm text-niebla">Todavía no hay datos para este ranking.</p>
        </div>
      )}

      {/* Lista completa */}
      {allMembers.length > 0 && (
        <div className="px-4 md:px-6 mb-6">
          <div className="bg-noche-media rounded-2xl p-4">
            <p className="text-[11px] font-semibold text-niebla uppercase tracking-wider mb-2">
              Ranking completo — {cur.label}
            </p>
            {allMembers.map((m, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 py-2.5 ${i > 0 ? "border-t border-white/[0.04]" : ""}`}
              >
                <span className={`w-6 text-center text-sm font-bold font-display ${i < 3 ? "text-ambar" : "text-niebla"}`}>
                  {i + 1}°
                </span>
                <Avatar name={m.name} colorIndex={m.colorIndex} size="sm" />
                <span className="flex-1 text-sm text-humo font-medium">{m.name}</span>
                <span className="text-sm text-niebla">{m.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 md:px-6 flex flex-col gap-2">
        {destacados.length > 0 && (
          <>
            <p className="text-[11px] font-semibold text-niebla uppercase tracking-wider mt-1 mb-1">Destacados</p>
            {destacados.map((r, i) => <BadgeRow key={i} {...r} />)}
          </>
        )}

        {datos.length > 0 && (
          <>
            <p className="text-[11px] font-semibold text-niebla uppercase tracking-wider mt-4 mb-1">Los datos no mienten</p>
            {datos.map((r, i) => <BadgeRow key={i} {...r} />)}
          </>
        )}

        <div className="mt-3">
          <Button full onClick={() => setShareOpen(true)}>
            <Share2 size={16} /> Compartir ranking
          </Button>
        </div>
      </div>

      <ShareStoryModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        filename={`ronda-ranking-${active}`}
      >
        <StoryRanking
          groupName={groupName}
          rankingEmoji={cur.emoji}
          rankingLabel={cur.label}
          top3={podium.map((p) => ({ position: p.position, name: p.name, score: p.score }))}
        />
      </ShareStoryModal>
    </div>
  );
}
