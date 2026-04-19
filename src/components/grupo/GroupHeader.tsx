"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, ChevronLeft, X } from "lucide-react";
import { Avatar, AvatarStack } from "@/components/ui/Avatar";

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
  const [membersOpen, setMembersOpen] = useState(false);

  return (
    <>
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
            {/* Members row — clickable */}
            <button
              onClick={() => setMembersOpen(true)}
              className="mt-1.5 flex items-center gap-2 bg-transparent border-none cursor-pointer p-0 group"
            >
              <AvatarStack members={members} />
              <span className="text-[12px] text-niebla group-hover:text-fuego transition-colors font-semibold">
                {members.length} integrante{members.length !== 1 ? "s" : ""} →
              </span>
            </button>
          </div>
          <button
            onClick={() => router.push(`/grupo/${groupId}/config`)}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-transparent border-none cursor-pointer text-niebla hover:bg-white/5 transition-colors"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Members sheet */}
      {membersOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setMembersOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-[60] bg-noche-media rounded-t-[20px] pt-3 max-h-[70vh] flex flex-col">
            <div className="flex justify-center mb-3 shrink-0">
              <div className="w-10 h-1 rounded-full bg-niebla/30" />
            </div>
            <div className="flex items-center justify-between px-5 mb-4 shrink-0">
              <h3 className="font-display font-bold text-lg text-humo">
                Integrantes <span className="text-niebla font-normal text-base">({members.length})</span>
              </h3>
              <button
                onClick={() => setMembersOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-transparent border-none cursor-pointer text-niebla hover:bg-white/5"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-8">
              {members.map((m, i) => (
                <div key={i} className={`flex items-center gap-3 py-3 ${i > 0 ? "border-t border-white/[0.05]" : ""}`}>
                  <Avatar emoji={m.emoji} name={m.name} colorIndex={m.colorIndex} size="sm" />
                  <span className="font-body text-sm text-humo font-medium">{m.name}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
