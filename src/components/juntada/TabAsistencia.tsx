"use client";

import { useState } from "react";
import { Check, X, Minus } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { MOCK_MEMBERS } from "@/lib/constants";
import { getRSVP, setRSVP, type RSVPStatus } from "@/lib/store";

interface TabAsistenciaProps {
  closed?: boolean;
  isNew?: boolean;
  upcoming?: boolean;
  juntadaId?: string;
}

const RSVP_CHIPS: {
  id: RSVPStatus;
  label: string;
  icon: typeof Check;
  activeClasses: string;
  iconColor: string;
  bgConfirmed: string;
  confirmLabel: string;
}[] = [
  {
    id: "voy", label: "Voy", icon: Check, confirmLabel: "Confirmaste que vas",
    activeClasses: "bg-menta/[0.15] ring-1 ring-menta/40",
    iconColor: "text-menta", bgConfirmed: "bg-menta/20",
  },
  {
    id: "no-voy", label: "No voy", icon: X, confirmLabel: "No vas a ir",
    activeClasses: "bg-error/[0.12] ring-1 ring-error/30",
    iconColor: "text-error", bgConfirmed: "bg-error/15",
  },
  {
    id: "no-se", label: "No sé", icon: Minus, confirmLabel: "Todavía no sabés",
    activeClasses: "bg-niebla/[0.15] ring-1 ring-niebla/40",
    iconColor: "text-niebla", bgConfirmed: "bg-niebla/15",
  },
];

export function TabAsistencia({ closed = false, isNew = false, upcoming = false, juntadaId }: TabAsistenciaProps) {
  const [rsvpStatus, setRsvpStatus] = useState<RSVPStatus>(() =>
    juntadaId ? getRSVP(juntadaId) : "none"
  );

  const handleRSVP = (s: RSVPStatus) => {
    setRsvpStatus(s);
    if (juntadaId) setRSVP(juntadaId, s);
  };

  // ─── Juntada próxima: mostrar RSVP ───────────────────────────────────────
  if (upcoming) {
    const currentChip = RSVP_CHIPS.find((c) => c.id === rsvpStatus);

    return (
      <div className="px-4 md:px-6 py-4">
        <p className="font-semibold text-sm text-humo mb-4">Tu respuesta</p>

        {rsvpStatus !== "none" && currentChip ? (
          <div className="flex items-center justify-between bg-noche-media rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${currentChip.bgConfirmed}`}>
                <currentChip.icon size={18} className={currentChip.iconColor} strokeWidth={2.5} />
              </div>
              <span className="text-sm font-medium text-humo">{currentChip.confirmLabel}</span>
            </div>
            <button
              onClick={() => handleRSVP("none")}
              className="text-xs text-fuego font-semibold bg-transparent border-none cursor-pointer"
            >
              Cambiar
            </button>
          </div>
        ) : (
          <div className="flex gap-2 mb-4">
            {RSVP_CHIPS.map((chip) => {
              const Icon = chip.icon;
              return (
                <button
                  key={chip.id}
                  onClick={() => handleRSVP(chip.id)}
                  className="
                    flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-sm font-semibold
                    border-none cursor-pointer transition-all
                    bg-white/5 text-niebla
                    hover:bg-white/10 active:scale-[0.97]
                  "
                >
                  <Icon size={15} strokeWidth={2.5} />
                  {chip.label}
                </button>
              );
            })}
          </div>
        )}

        <p className="text-xs text-niebla text-center mt-6">
          La asistencia se registra después de la juntada.
        </p>
      </div>
    );
  }

  // ─── Juntada pasada: marcar quién fue ─────────────────────────────────────
  const [editing, setEditing] = useState(isNew);
  const [checks, setChecks] = useState<boolean[]>(
    isNew ? MOCK_MEMBERS.map(() => false) : MOCK_MEMBERS.map((_, i) => i < 6)
  );

  const toggle = (i: number) => {
    if (!editing) return;
    const next = [...checks];
    next[i] = !next[i];
    setChecks(next);
  };

  const count = checks.filter(Boolean).length;

  const handleConfirm = () => {
    setEditing(false);
    // TODO: guardar en Supabase
  };

  return (
    <div className="px-4 md:px-6 py-4">
      <div className="flex items-center justify-between mb-3">
        <p className="font-semibold text-sm text-humo">
          {count} de {MOCK_MEMBERS.length} fueron
        </p>
        {!editing && !closed && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs font-semibold text-fuego bg-transparent border-none cursor-pointer"
          >
            Editar
          </button>
        )}
      </div>

      {MOCK_MEMBERS.map((m, i) => (
        <div
          key={m.id}
          onClick={() => toggle(i)}
          className={`
            flex items-center gap-3 py-3
            ${editing ? "cursor-pointer" : ""}
            ${i > 0 ? "border-t border-white/[0.04]" : ""}
          `}
        >
          <Avatar emoji={m.emoji} name={m.name} colorIndex={m.colorIndex} />
          <span className="flex-1 text-[15px] text-humo">{m.name}</span>

          {editing ? (
            <div
              className={`
                w-11 h-6 rounded-full relative transition-colors
                ${checks[i] ? "bg-fuego" : "bg-niebla/30"}
              `}
            >
              <div
                className={`
                  w-[18px] h-[18px] rounded-full bg-white absolute top-[3px] transition-[left]
                  ${checks[i] ? "left-[21px]" : "left-[3px]"}
                `}
              />
            </div>
          ) : (
            <span className={`text-[13px] font-medium ${checks[i] ? "text-exito" : "text-niebla"}`}>
              {checks[i] ? "✅ Fue" : "❌ No fue"}
            </span>
          )}
        </div>
      ))}

      {editing && (
        <div className="mt-4">
          <Button full onClick={handleConfirm}>Confirmar asistencia</Button>
        </div>
      )}

      {isNew && !editing && count === 0 && (
        <div className="text-center py-6">
          <p className="text-sm text-niebla mb-3">Todavía nadie confirmó quién fue.</p>
          <Button onClick={() => setEditing(true)}>Registrar asistencia</Button>
        </div>
      )}
    </div>
  );
}
