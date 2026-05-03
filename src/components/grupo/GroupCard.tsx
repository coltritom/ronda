"use client";

import { useRouter } from "next/navigation";

interface GroupCardProps {
  id: string;
  name: string;
  emoji: string;
  memberCount: number;
  lastActivity: string;
  pendingCount: number;
  pendingAmount: number;
}

export function GroupCard({ id, name, emoji, memberCount, lastActivity, pendingCount, pendingAmount }: GroupCardProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(`/groups/${id}`)}
      className="w-full text-left bg-noche-media rounded-2xl p-4 border-none cursor-pointer transition-all active:scale-[0.98] hover:bg-noche-media/80"
    >
      <div className="flex gap-3 items-start">
        <span className="text-[28px] shrink-0">{emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-[17px] text-humo truncate">
            {name}
          </p>
          <p className="font-body text-[13px] text-niebla mt-0.5">
            {memberCount} integrantes · última juntada: {lastActivity}
          </p>
        </div>

        {pendingCount > 0 && (
          <span className="shrink-0 bg-alerta/[0.15] border border-alerta/30 rounded-full px-2 py-0.5 text-[11px] font-semibold text-alerta whitespace-nowrap">
            {pendingCount} pendiente{pendingCount > 1 ? "s" : ""}
          </span>
        )}
      </div>
    </button>
  );
}
