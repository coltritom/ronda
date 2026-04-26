"use client";

import { useState } from "react";
import { Check, X, Minus } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { MOCK_MEMBERS } from "@/lib/constants";
import { getRSVP, setRSVP, type RSVPStatus, getGuests, addGuest, removeGuest, type GuestMember } from "@/lib/store";

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
  // All hooks must be declared before any conditional return
  const [rsvpStatus, setRsvpStatus] = useState<RSVPStatus>(() =>
    juntadaId ? getRSVP(juntadaId) : "none"
  );
  const [editing, setEditing] = useState(isNew);
  const [checks, setChecks] = useState<boolean[]>(
    isNew ? MOCK_MEMBERS.map(() => false) : MOCK_MEMBERS.map((_, i) => i < 6)
  );
  const [guests, setGuests] = useState<GuestMember[]>(() =>
    juntadaId ? getGuests(juntadaId) : []
  );
  const [guestInput, setGuestInput] = useState("");
  const [showGuestInput, setShowGuestInput] = useState(false);

  const handleRSVP = (s: RSVPStatus) => {
    setRsvpStatus(s);
    if (juntadaId) setRSVP(juntadaId, s);
  };

  const toggle = (i: number) => {
    if (!editing) return;
    const next = [...checks];
    next[i] = !next[i];
    setChecks(next);
  };

  const count = checks.filter(Boolean).length;

  const handleConfirm = () => setEditing(false);

  const handleAddGuest = () => {
    const trimmed = guestInput.trim();
    if (!trimmed || !juntadaId) return;
    const guest = addGuest(juntadaId, trimmed);
    setGuests((prev) => [...prev, guest]);
    setGuestInput("");
    setShowGuestInput(false);
  };

  const handleRemoveGuest = (guestId: string) => {
    if (!juntadaId) return;
    removeGuest(juntadaId, guestId);
    setGuests((prev) => prev.filter((g) => g.id !== guestId));
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

  // ─── Juntada pasada: marcar quién fue + invitados ─────────────────────────
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

      {/* Invitados */}
      {guests.length > 0 && (
        <div className="mt-1 border-t border-white/[0.04]">
          {guests.map((g) => (
            <div key={g.id} className="flex items-center gap-3 py-3">
              <Avatar emoji="👤" name={g.name} colorIndex={3} />
              <span className="flex-1 text-[15px] text-humo">{g.name}</span>
              <span className="text-[10px] text-niebla/50 bg-white/[0.06] px-1.5 py-0.5 rounded-full">
                invitado
              </span>
              {!closed && (
                <button
                  onClick={() => handleRemoveGuest(g.id)}
                  className="text-niebla/40 hover:text-fuego bg-transparent border-none cursor-pointer p-1 transition-colors"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Agregar invitado */}
      {!closed && (
        <div className="mt-3">
          {showGuestInput ? (
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={guestInput}
                onChange={(e) => setGuestInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddGuest()}
                placeholder="Nombre del invitado"
                autoFocus
                className="flex-1 px-3 py-2 rounded-[10px] border-[1.5px] border-white/[0.08] bg-noche-media text-[14px] text-humo placeholder:text-niebla outline-none font-body"
              />
              <button
                onClick={handleAddGuest}
                className="px-3 py-2 rounded-[10px] bg-fuego/[0.12] text-fuego text-sm font-semibold border-none cursor-pointer"
              >
                Listo
              </button>
              <button
                onClick={() => { setShowGuestInput(false); setGuestInput(""); }}
                className="p-1.5 text-niebla/50 bg-transparent border-none cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowGuestInput(true)}
              className="flex items-center gap-2 text-[13px] text-niebla/60 bg-transparent border-none cursor-pointer py-1 hover:text-niebla transition-colors"
            >
              <span className="w-5 h-5 rounded-full border border-niebla/25 flex items-center justify-center text-niebla text-xs leading-none">
                +
              </span>
              Agregar invitado
            </button>
          )}
        </div>
      )}

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
