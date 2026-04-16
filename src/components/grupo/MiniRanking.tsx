"use client";

import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Pill } from "@/components/ui/Pill";

interface RankingEntry {
  emoji: string;
  label: string;
  name: string;
  detail: string;
  memberEmoji: string;
  memberColorIndex: number;
  variant: "ambar" | "uva" | "rosa";
}

interface MiniRankingProps {
  entries: RankingEntry[];
  groupId: string;
}

export function MiniRanking({ entries, groupId }: MiniRankingProps) {
  const router = useRouter();

  return (
    <div className="bg-noche-media rounded-2xl p-4">
      <div className="flex justify-between items-center mb-3">
        <span className="font-display font-semibold text-base text-humo">
          El ranking no miente
        </span>
        <button
          onClick={() => router.push(`/grupo/${groupId}/rankings`)}
          className="bg-transparent border-none text-fuego font-semibold text-xs cursor-pointer p-0"
        >
          Ver todo →
        </button>
      </div>

      {entries.map((r, i) => (
        <div
          key={i}
          className={`flex items-center gap-2.5 py-2 ${i > 0 ? "border-t border-white/[0.06]" : ""}`}
        >
          <Avatar emoji={r.memberEmoji} name={r.name} colorIndex={r.memberColorIndex} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-humo">{r.name}</p>
            <p className="text-xs text-niebla">{r.detail}</p>
          </div>
          <Pill color={r.variant}>{r.emoji} {r.label}</Pill>
        </div>
      ))}
    </div>
  );
}
