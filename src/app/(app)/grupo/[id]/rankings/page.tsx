"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import RankingsContent from "./RankingsContent";

export default function GroupRankingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  return (
    <div>
      <div className="px-4 md:px-6 pt-4">
        <button
          onClick={() => router.push(`/grupo/${id}`)}
          className="flex items-center gap-1 text-fuego text-[13px] font-semibold bg-transparent border-none cursor-pointer p-0 mb-1"
        >
          <ChevronLeft size={16} />
          Los del asado
        </button>
      </div>
      <RankingsContent />
    </div>
  );
}
