"use client";

import { useRouter } from "next/navigation";
import { fmtARS } from "@/lib/utils";

interface PendingAlertProps {
  count: number;
  amount: number;
  groupId: string;
}

export function PendingAlert({ count, amount, groupId }: PendingAlertProps) {
  const router = useRouter();

  return (
    <div className="bg-noche-media rounded-2xl p-4 border-l-[3px] border-alerta">
      <div className="flex justify-between items-center">
        <div>
          <p className="font-semibold text-sm text-humo">
            Hay {count} cuenta{count > 1 ? "s" : ""} sin saldar
          </p>
          <p className="text-[13px] text-niebla mt-0.5">
            ${fmtARS(amount)} pendientes
          </p>
        </div>
        <button
          onClick={() => router.push(`/groups/${groupId}/cuentas`)}
          className="bg-transparent border-none text-fuego font-semibold text-[13px] cursor-pointer p-0"
        >
          Ver cuentas →
        </button>
      </div>
    </div>
  );
}
