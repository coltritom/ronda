"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Minus } from "lucide-react";

type RSVPStatus = "voy" | "no-voy" | "no-se";

const CHIPS: { id: RSVPStatus; label: string; icon: typeof Check; symbol: string }[] = [
  { id: "voy", label: "Voy", icon: Check, symbol: "✓" },
  { id: "no-voy", label: "No voy", icon: X, symbol: "✗" },
  { id: "no-se", label: "No sé", icon: Minus, symbol: "—" },
];

const UPCOMING = [
  { rsvpId: "j-next-1", groupEmoji: "🔥", groupName: "Los del asado", groupId: "g1", name: "Asado en lo de Mati", date: "Sáb 5 abr, 20:00", confirmed: 5, pending: 3 },
  { rsvpId: "j-next-2", groupEmoji: "⚽", groupName: "Fútbol 5", groupId: "g2", name: "Partido semanal", date: "Mié 9 abr, 21:00", confirmed: 8, pending: 2 },
];

export function UpcomingJuntadas() {
  const router = useRouter();
  const [rsvp, setRsvp] = useState<Record<string, RSVPStatus | undefined>>({});

  if (UPCOMING.length === 0) {
    return (
      <div className="px-4 md:px-6 mb-3">
        <p className="font-display font-semibold text-[15px] text-carbon dark:text-humo mb-2">
          Próximas juntadas
        </p>
        <div className="bg-noche-media dark:bg-noche-media bg-crema rounded-2xl p-5 text-center">
          <p className="text-sm text-gris-cal dark:text-niebla mb-3">
            No hay juntadas armadas. ¿Armás una?
          </p>
          <button className="text-sm font-semibold text-fuego bg-transparent border-none cursor-pointer">
            Crear juntada
          </button>
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
        {UPCOMING.map((j) => {
          const status = rsvp[j.rsvpId];
          const chipData = CHIPS.find((c) => c.id === status);

          return (
            <div key={j.rsvpId} className="bg-noche-media dark:bg-noche-media bg-crema rounded-2xl p-3.5">
              {/* Info */}
              <div className="mb-1.5">
                <p className="text-[11px] text-gris-cal dark:text-niebla m-0">
                  {j.groupEmoji} {j.groupName}
                </p>
                <p className="font-semibold text-sm text-carbon dark:text-humo mt-0.5">
                  {j.name}
                </p>
                <p className="text-xs text-gris-cal dark:text-niebla mt-0.5">
                  {j.date} · {j.confirmed} van · {j.pending} sin respuesta
                </p>
              </div>

              {/* RSVP */}
              {status && chipData ? (
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1.5">
                    <div className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-xs
                      ${status === "voy" ? "bg-menta/20 text-menta" : ""}
                      ${status === "no-voy" ? "bg-error/15 text-error" : ""}
                      ${status === "no-se" ? "bg-niebla/15 text-niebla" : ""}
                    `}>
                      {chipData.symbol}
                    </div>
                    <span className="text-xs font-medium text-carbon dark:text-humo">
                      {status === "voy" ? "Vas" : status === "no-voy" ? "No vas" : "No sabés"}
                    </span>
                  </div>
                  <button
                    onClick={() => setRsvp((p) => ({ ...p, [j.rsvpId]: undefined }))}
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
                        onClick={() => setRsvp((p) => ({ ...p, [j.rsvpId]: chip.id }))}
                        className="
                          flex-1 flex items-center justify-center gap-1 py-2 rounded-full
                          text-xs font-semibold border-none cursor-pointer transition-all
                          bg-white/5 dark:bg-white/5 bg-black/5
                          text-gris-cal dark:text-niebla
                          hover:bg-white/10 dark:hover:bg-white/10 hover:bg-black/10
                          active:scale-[0.97]
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
