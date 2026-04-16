"use client";

import { useRouter } from "next/navigation";
import { fmtARS } from "@/lib/utils";

const DEBTS = [
  { group: "🔥 Los del asado", groupId: "g1", to: "Mati", amount: 2400 },
  { group: "🔥 Los del asado", groupId: "g1", to: "Lucía", amount: 1200 },
  { group: "🏖️ Depto vacaciones", groupId: "g3", to: "Sofi", amount: 1200 },
];

export function PendingDebts() {
  const router = useRouter();
  const total = DEBTS.reduce((s, d) => s + d.amount, 0);
  const groupCount = new Set(DEBTS.map((d) => d.groupId)).size;

  if (DEBTS.length === 0) return null;

  return (
    <div className="px-4 md:px-6 mb-3">
      <div className="bg-noche-media dark:bg-noche-media bg-crema rounded-2xl p-3.5 border-l-[3px] border-alerta">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-semibold text-sm text-carbon dark:text-humo m-0">
              {DEBTS.length} cuenta{DEBTS.length > 1 ? "s" : ""} pendiente{DEBTS.length > 1 ? "s" : ""}
            </p>
            <p className="text-xs text-gris-cal dark:text-niebla mt-0.5">
              en {groupCount} grupo{groupCount > 1 ? "s" : ""} · ${fmtARS(total)} en total
            </p>
          </div>
          <button
            onClick={() => router.push("/grupo/g1/cuentas")}
            className="text-xs font-semibold text-fuego bg-transparent border-none cursor-pointer p-0"
          >
            Ver →
          </button>
        </div>

        {/* Desglose */}
        <div className="mt-2.5 flex flex-col gap-1.5">
          {DEBTS.map((d, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-2 py-1.5 rounded-[10px] bg-noche dark:bg-noche bg-hueso"
            >
              <span className="text-xs text-gris-cal dark:text-niebla">
                {d.group} → {d.to}
              </span>
              <span className="text-[13px] font-semibold text-carbon dark:text-humo">
                ${fmtARS(d.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
