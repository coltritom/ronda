"use client";

import { useRouter } from "next/navigation";
import { Settings, ChevronLeft } from "lucide-react";
import { AvatarStack } from "@/components/ui/Avatar";

interface GroupHeaderProps {
  groupId: string;
  name: string;
  emoji: string;
  members: { emoji?: string; name: string; colorIndex?: number }[];
  showBack?: boolean;
  backHref?: string;
  backLabel?: string;
}

export function GroupHeader({ groupId, name, emoji, members, showBack = false, backHref, backLabel }: GroupHeaderProps) {
  const router = useRouter();

  return (
    <div className="px-4 md:px-6 pt-4 pb-3">
      {showBack && (
        <button
          onClick={() => router.push(backHref || "/grupos")}
          className="flex items-center gap-1 text-fuego text-[13px] font-semibold bg-transparent border-none cursor-pointer mb-2 p-0"
        >
          <ChevronLeft size={16} />
          {backLabel || "Volver"}
        </button>
      )}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[22px]">{emoji}</span>
            <h1 className="font-display font-bold text-[22px] text-humo">{name}</h1>
          </div>
          <div className="mt-1.5">
            <AvatarStack members={members} />
          </div>
        </div>
        <button
          onClick={() => router.push(`/grupo/${groupId}/config`)}
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-transparent border-none cursor-pointer text-niebla hover:bg-white/5 transition-colors"
        >
          <Settings size={20} />
        </button>
      </div>
    </div>
  );
}
