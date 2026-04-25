"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import RankingsContent from "./RankingsContent";
import { getGroup } from "@/lib/constants";

export default function GroupRankingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const group = getGroup(id);

  if (!group) {
    return (
      <div className="max-w-2xl mx-auto px-4 md:px-6 pt-8 pb-8 text-center">
        <p className="text-sm text-niebla mb-4">Grupo no encontrado.</p>
        <a href="/home" className="text-fuego text-sm font-semibold">Ir al inicio</a>
      </div>
    );
  }

  return (
    <div>
      <div className="px-4 md:px-6 pt-4">
        <button
          onClick={() => router.push(`/grupo/${id}`)}
          className="flex items-center gap-1 text-fuego text-[13px] font-semibold bg-transparent border-none cursor-pointer p-0 mb-1"
        >
          <ChevronLeft size={16} />
          {group.name}
        </button>
      </div>
      <RankingsContent groupName={group.name} />
    </div>
  );
}
