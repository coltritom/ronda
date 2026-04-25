"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";
import { Share2, ChevronDown } from "lucide-react";
import { ShareStoryModal } from "@/components/share/ShareStoryModal";
import { StoryRanking } from "@/components/share/StoryRanking";

type RankingType = "asistencias" | "aportes" | "anfitrion";

const RANKING_TYPES: { id: RankingType; emoji: string; label: string }[] = [
  { id: "asistencias", emoji: "🏆", label: "Más asistencias" },
  { id: "aportes", emoji: "💰", label: "Más aportes" },
  { id: "anfitrion", emoji: "🏠", label: "Anfitrión de oro" },
];

const PODIUM_DATA: Record<RankingType, { position: number; name: string; emoji: string; colorIndex: number; score: string }[]> = {
  asistencias: [
    { position: 2, name: "Lucía", emoji: "👩", colorIndex: 2, score: "7/8" },
    { position: 1, name: "Mati", emoji: "🧔", colorIndex: 0, score: "8/8 — Invicto" },
    { position: 3, name: "Sofi", emoji: "💃", colorIndex: 3, score: "7/8" },
  ],
  aportes: [
    { position: 2, name: "Mati", emoji: "🧔", colorIndex: 0, score: "31 pts" },
    { position: 1, name: "Lucía", emoji: "👩", colorIndex: 2, score: "38 pts" },
    { position: 3, name: "Facu", emoji: "🧑", colorIndex: 4, score: "22 pts" },
  ],
  anfitrion: [
    { position: 2, name: "Nico", emoji: "😎", colorIndex: 1, score: "2 veces" },
    { position: 1, name: "Mati", emoji: "🧔", colorIndex: 0, score: "5 veces" },
    { position: 3, name: "Lucía", emoji: "👩", colorIndex: 2, score: "1 vez" },
  ],
};

const FULL_LIST = [
  { name: "Facu", emoji: "🧑", colorIndex: 4 },
  { name: "Caro", emoji: "👱‍♀️", colorIndex: 0 },
  { name: "Tomi", emoji: "🙋‍♂️", colorIndex: 1 },
  { name: "Juli", emoji: "🤙", colorIndex: 2 },
  { name: "Nico", emoji: "😎", colorIndex: 1 },
];

const SCORES: Record<RankingType, string[]> = {
  asistencias: ["5/8", "5/8", "4/8", "3/8", "3/8"],
  aportes: ["18 pts", "14 pts", "11 pts", "9 pts", "7 pts"],
  anfitrion: ["0 veces", "0 veces", "0 veces", "0 veces", "0 veces"],
};

const DESTACADOS = [
  { emoji: "🏆", label: "El más presente", name: "Mati", detail: "No se perdió ni una", memberEmoji: "🧔", colorIndex: 0, variant: "ambar" as const },
  { emoji: "💰", label: "La más aportadora", name: "Lucía", detail: "38 pts — comida, bebidas y más", memberEmoji: "👩", colorIndex: 2, variant: "ambar" as const },
  { emoji: "🏅", label: "MVP de la ronda", name: "Mati", detail: "Más asistencias + más aportes", memberEmoji: "🧔", colorIndex: 0, variant: "rosa" as const },
  { emoji: "🏠", label: "Anfitrión de oro", name: "Mati", detail: "Puso la casa 5 veces", memberEmoji: "🧔", colorIndex: 0, variant: "ambar" as const },
];

const DATOS = [
  { emoji: "👻", label: "Fantasma oficial", name: "Nico", detail: "Faltó 5 de 8 juntadas", memberEmoji: "😎", colorIndex: 1, variant: "uva" as const },
  { emoji: "⏰", label: "Siempre paga tarde", name: "Facu", detail: "Último en pagar 4 veces", memberEmoji: "🧑", colorIndex: 4, variant: "uva" as const },
  { emoji: "😅", label: "Deudor serial", name: "Juli", detail: "Acumuló deuda en 3 juntadas", memberEmoji: "🤙", colorIndex: 2, variant: "uva" as const },
];

interface BadgeRowProps { emoji: string; label: string; name: string; detail: string; memberEmoji: string; colorIndex: number; variant: "ambar" | "uva" | "rosa"; }

function BadgeRow({ emoji, label, name, detail, memberEmoji, colorIndex, variant }: BadgeRowProps) {
  return (
    <div className="bg-noche-media rounded-2xl p-4">
      <div className="flex items-center gap-2.5">
        <Avatar emoji={memberEmoji} name={name} colorIndex={colorIndex} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[15px] text-humo">{name}</p>
          <p className="text-xs text-niebla">{detail}</p>
        </div>
        <Pill color={variant}>{emoji} {label}</Pill>
      </div>
    </div>
  );
}

export default function RankingsContent({ groupName }: { groupName: string }) {
  const [active, setActive] = useState<RankingType>("asistencias");
  const [ddOpen, setDdOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const cur = RANKING_TYPES.find((r) => r.id === active)!;
  const podium = PODIUM_DATA[active];

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
      <div className="flex items-end justify-center gap-3 px-6 pt-2 pb-6">
        {podium.map((p) => {
          const isFirst = p.position === 1;
          return (
            <div key={p.position} className="text-center flex-1 flex flex-col items-center">
              {isFirst && <span className="text-sm mb-0.5">👑</span>}
              <Avatar emoji={p.emoji} name={p.name} colorIndex={p.colorIndex} size={isFirst ? "lg" : "md"} />
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

      {/* Lista completa */}
      <div className="px-4 md:px-6 mb-6">
        <div className="bg-noche-media rounded-2xl p-4">
          <p className="text-[11px] font-semibold text-niebla uppercase tracking-wider mb-2">
            Ranking completo — {cur.label}
          </p>
          {[...podium]
            .sort((a, b) => a.position - b.position)
            .concat(FULL_LIST.map((m, i) => ({ position: i + 4, ...m, score: SCORES[active][i] })))
            .map((p, i) => (
              <div
                key={p.position}
                className={`flex items-center gap-3 py-2.5 ${i > 0 ? "border-t border-white/[0.04]" : ""}`}
              >
                <span className={`w-6 text-center text-sm font-bold font-display ${p.position <= 3 ? "text-ambar" : "text-niebla"}`}>
                  {p.position}
                </span>
                <Avatar emoji={p.emoji} name={p.name} colorIndex={p.colorIndex} size="sm" />
                <span className="flex-1 text-sm text-humo font-medium">{p.name}</span>
                <span className="text-sm text-niebla">{p.score}</span>
              </div>
            ))}
        </div>
      </div>

      <div className="px-4 md:px-6 flex flex-col gap-2">
        <p className="text-[11px] font-semibold text-niebla uppercase tracking-wider mt-1 mb-1">Destacados</p>
        {DESTACADOS.map((r, i) => <BadgeRow key={i} {...r} />)}

        <p className="text-[11px] font-semibold text-niebla uppercase tracking-wider mt-4 mb-1">Los datos no mienten</p>
        {DATOS.map((r, i) => <BadgeRow key={i} {...r} />)}

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
