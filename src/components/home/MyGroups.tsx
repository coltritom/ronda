"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MOCK_GROUPS } from "@/lib/constants";
import { CreateGroupSheet } from "@/components/grupo/CreateGroupSheet";

export function MyGroups() {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="px-4 md:px-6 mb-3">
      <div className="flex justify-between items-center mb-2">
        <p className="font-display font-semibold text-[15px] text-carbon dark:text-humo m-0">
          Tus grupos
        </p>
        <button onClick={() => setSheetOpen(true)} className="text-xs font-semibold text-fuego bg-transparent border-none cursor-pointer">
          + Crear
        </button>
      </div>

      <div className="flex gap-2">
        {MOCK_GROUPS.map((g) => (
          <button
            key={g.id}
            onClick={() => router.push(`/grupo/${g.id}`)}
            className="
              flex-1 bg-noche-media dark:bg-noche-media bg-crema rounded-[14px]
              py-3.5 px-2.5 text-center cursor-pointer border-none
              transition-all active:scale-[0.97] hover:opacity-90
              relative
            "
          >
            {g.pendingCount > 0 && (
              <span className="
                absolute top-2 right-2 w-[18px] h-[18px] rounded-full
                bg-alerta/20 text-alerta text-[10px] font-bold
                flex items-center justify-center
              ">
                {g.pendingCount}
              </span>
            )}
            <span className="text-2xl block">{g.emoji}</span>
            <p className="
              text-xs font-semibold text-carbon dark:text-humo mt-1.5
              overflow-hidden text-ellipsis whitespace-nowrap
            ">
              {g.name}
            </p>
          </button>
        ))}
      </div>

      <CreateGroupSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}
