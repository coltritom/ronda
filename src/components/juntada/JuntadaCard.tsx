"use client";

import { useRouter } from "next/navigation";
import { LUGAR_OPTIONS } from "@/lib/constants";
import { fmtARS } from "@/lib/utils";

interface JuntadaCardProps {
  id: string;
  date: string;
  name?: string;
  attendees: number;
  totalSpent: number;
  closed: boolean;
  lugarId?: string;
  hostName?: string;
  groupId?: string;
  groupName?: string;
}

export function JuntadaCard({ id, date, name, attendees, totalSpent, closed, lugarId, hostName, groupId, groupName }: JuntadaCardProps) {
  const router = useRouter();
  const lugar = LUGAR_OPTIONS.find((l) => l.id === lugarId);

  const handleClick = () => {
    const params = new URLSearchParams();
    if (groupId) params.set("g", groupId);
    if (groupName) params.set("gn", groupName);
    const qs = params.toString();
    router.push(`/juntada/${id}${qs ? `?${qs}` : ""}`);
  };

  return (
    <button
      onClick={handleClick}
      className="w-full text-left bg-noche-media rounded-2xl p-4 border-none cursor-pointer transition-all active:scale-[0.98] hover:opacity-90"
    >
      <div className="flex justify-between items-start">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-niebla">{date}</p>
          <p className="font-semibold text-[15px] text-humo mt-0.5 truncate">
            {name || `Juntada del ${date}`}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <p className="text-[13px] text-niebla">
              {attendees} fueron · ${fmtARS(totalSpent)}
            </p>
            {lugar && (
              <span className="text-[11px] text-niebla">
                · {lugar.emoji} {hostName ? `en lo de ${hostName}` : lugar.label}
              </span>
            )}
          </div>
        </div>
        <span
          className={`
            shrink-0 ml-3 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border
            ${closed
              ? "bg-menta/[0.12] text-menta border-menta/30"
              : "bg-alerta/[0.12] text-alerta border-alerta/30"
            }
          `}
        >
          {closed ? "✓ Cerrada" : "Abierta"}
        </span>
      </div>
    </button>
  );
}
