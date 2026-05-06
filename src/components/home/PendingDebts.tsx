import Link from "next/link";
import { fmtARS } from "@/lib/utils";

export interface DebtItem {
  groupId: string;
  groupName: string;
  groupEmoji: string;
  eventId: string;
  payerName: string;
  amount: number;
}

export function PendingDebts({ debts }: { debts: DebtItem[] }) {
  if (debts.length === 0) return null;

  const total = debts.reduce((s, d) => s + d.amount, 0);
  const groupCount = new Set(debts.map((d) => d.groupId)).size;

  return (
    <div className="px-4 md:px-6 mb-3">
      <div className="bg-noche-media dark:bg-noche-media bg-crema rounded-2xl p-3.5 border-l-[3px] border-alerta">
        <div className="flex items-start justify-between mb-1">
          <p className="font-semibold text-sm text-carbon dark:text-humo">
            {debts.length} cuenta{debts.length > 1 ? "s" : ""} pendiente{debts.length > 1 ? "s" : ""}
          </p>
          <Link
            href="/groups"
            className="text-[12px] font-semibold text-fuego shrink-0 ml-2"
          >
            Ver →
          </Link>
        </div>
        <p className="text-xs text-gris-cal dark:text-niebla mb-2.5">
          en {groupCount} grupo{groupCount > 1 ? "s" : ""} · ${fmtARS(total)} en total
        </p>

        <div className="flex flex-col gap-1.5">
          {debts.map((d) => (
            <Link
              key={`${d.groupId}-${d.eventId}`}
              href={`/groups/${d.groupId}`}
              className="flex items-center justify-between px-2 py-1.5 rounded-[10px] bg-noche dark:bg-noche bg-hueso w-full"
            >
              <span className="text-xs text-carbon dark:text-humo">
                {d.groupEmoji} {d.groupName} → {d.payerName}
              </span>
              <span className="text-[13px] font-semibold text-carbon dark:text-humo shrink-0 ml-2">
                ${fmtARS(d.amount)}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
