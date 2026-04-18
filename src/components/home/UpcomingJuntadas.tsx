"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Minus } from "lucide-react";
import { MOCK_GROUP_DETAILS, MOCK_GROUPS } from "@/lib/constants";
import { getNewJuntadas, getRSVP, setRSVP, type RSVPStatus } from "@/lib/store";

const CHIPS: { id: RSVPStatus; label: string; icon: typeof Check; symbol: string }[] = [
  { id: "voy",    label: "Voy",    icon: Check, symbol: "✓" },
  { id: "no-voy", label: "No voy", icon: X,     symbol: "✗" },
  { id: "no-se",  label: "No sé",  icon: Minus,  symbol: "—" },
];

export function UpcomingJuntadas() {
  const router = useRouter();
  const TODAY = new Date().toISOString().slice(0, 10);

  // Aggregate upcoming juntadas from all groups (static + dynamic store)
  const upcoming = MOCK_GROUPS.flatMap((g) => {
    const detail = MOCK_GROUP_DETAILS[g.id];
    if (!detail) return [];
    const all = [...getNewJuntadas(g.id), ...detail.juntadas];
    return all
      .filter((j) => j.isoDate >= TODAY)
      .map((j) => ({ ...j, groupId: g.id, groupName: g.name, groupEmoji: g.emoji }));
  }).sort((a, b) => a.isoDate.localeCompare(b.isoDate));

  // RSVP state backed by the shared store (same store NextJuntada uses)
  const [rsvpMap, setRsvpMap] = useState<Record<string, RSVPStatus>>(() => {
    const map: Record<string, RSVPStatus> = {};
    for (const j of upcoming) {
      map[j.id] = getRSVP(j.id);
    }
    return map;
  });

  const handleRSVP = (juntadaId: string, status: RSVPStatus) => {
    setRSVP(juntadaId, status);
    setRsvpMap((prev) => ({ ...prev, [juntadaId]: status }));
  };

  const clearRSVP = (juntadaId: string) => {
    setRSVP(juntadaId, "none");
    setRsvpMap((prev) => ({ ...prev, [juntadaId]: "none" }));
  };

  if (upcoming.length === 0) {
    return (
      <div className="px-4 md:px-6 mb-3">
        <p className="font-display font-semibold text-[15px] text-carbon dark:text-humo mb-2">
          Próximas juntadas
        </p>
        <div className="bg-noche-media dark:bg-noche-media bg-crema rounded-2xl p-5 text-center">
          <p className="text-sm text-gris-cal dark:text-niebla mb-3">
            No hay juntadas armadas. ¿Armás una?
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 mb-3">
      <p className="font-display font-semibold text-[15px] text-carbon dark:text-humo mb-2">
        Próximas juntadas
      </p>

      <div className="flex flex-col gap-2">
        {upcoming.map((j) => {
          const status = rsvpMap[j.id] ?? getRSVP(j.id);
          const chipData = CHIPS.find((c) => c.id === status);

          return (
            <div key={j.id} className="bg-noche-media dark:bg-noche-media bg-crema rounded-2xl p-3.5">
              {/* Header */}
              <div className="flex items-start justify-between mb-1.5">
                <div className="flex-1">
                  <p className="text-[11px] text-gris-cal dark:text-niebla m-0">
                    {j.groupEmoji} {j.groupName}
                  </p>
                  <p className="font-semibold text-sm text-carbon dark:text-humo mt-0.5">
                    {j.name}
                  </p>
                  <p className="text-xs text-gris-cal dark:text-niebla mt-0.5">
                    {j.date}
                    {(j.confirmed ?? 0) > 0 && ` · ${j.confirmed} van`}
                    {(j.noResponse ?? 0) > 0 && ` · ${j.noResponse} sin respuesta`}
                  </p>
                </div>
                <button
                  onClick={() => router.push(`/grupo/${j.groupId}`)}
                  className="text-[11px] font-semibold text-fuego bg-transparent border-none cursor-pointer shrink-0 ml-2"
                >
                  Ver grupo →
                </button>
              </div>

              {/* RSVP */}
              {status !== "none" && chipData ? (
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1.5">
                    <div className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-xs
                      ${status === "voy"    ? "bg-menta/20 text-menta"  : ""}
                      ${status === "no-voy" ? "bg-error/15 text-error"  : ""}
                      ${status === "no-se"  ? "bg-niebla/15 text-niebla": ""}
                    `}>
                      {chipData.symbol}
                    </div>
                    <span className="text-xs font-medium text-carbon dark:text-humo">
                      {status === "voy" ? "Vas" : status === "no-voy" ? "No vas" : "No sabés"}
                    </span>
                  </div>
                  <button
                    onClick={() => clearRSVP(j.id)}
                    className="text-[11px] font-semibold text-fuego bg-transparent border-none cursor-pointer"
                  >
                    Cambiar
                  </button>
                </div>
              ) : (
                <div className="flex gap-1.5 mt-2">
                  {CHIPS.map((chip) => {
                    const Icon = chip.icon;
                    return (
                      <button
                        key={chip.id}
                        onClick={() => handleRSVP(j.id, chip.id)}
                        className="
                          flex-1 flex items-center justify-center gap-1 py-2 rounded-full
                          text-xs font-semibold border-none cursor-pointer transition-all
                          bg-white/5 dark:bg-white/5 bg-black/5
                          text-gris-cal dark:text-niebla
                          hover:bg-white/10 active:scale-[0.97]
                        "
                      >
                        <Icon size={13} strokeWidth={2.5} />
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
