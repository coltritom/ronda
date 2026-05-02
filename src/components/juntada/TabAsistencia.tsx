"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, X, Minus } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/clients";

type RSVPStatus = "going" | "not_going" | "maybe" | "none";

interface Member {
  id: string;
  name: string;
  colorIndex: number;
}

interface GuestMember {
  id: string;
  name: string;
}

interface TabAsistenciaProps {
  closed?: boolean;
  upcoming?: boolean;
  juntadaId: string;
  groupId: string;
}

const RSVP_CHIPS: {
  id: Exclude<RSVPStatus, "none">;
  label: string;
  icon: typeof Check;
  activeClasses: string;
  iconColor: string;
  bgConfirmed: string;
  confirmLabel: string;
}[] = [
  {
    id: "going", label: "Voy", icon: Check, confirmLabel: "Confirmaste que vas",
    activeClasses: "bg-menta/[0.15] ring-1 ring-menta/40",
    iconColor: "text-menta", bgConfirmed: "bg-menta/20",
  },
  {
    id: "not_going", label: "No voy", icon: X, confirmLabel: "No vas a ir",
    activeClasses: "bg-error/[0.12] ring-1 ring-error/30",
    iconColor: "text-error", bgConfirmed: "bg-error/15",
  },
  {
    id: "maybe", label: "No sé", icon: Minus, confirmLabel: "Todavía no sabés",
    activeClasses: "bg-niebla/[0.15] ring-1 ring-niebla/40",
    iconColor: "text-niebla", bgConfirmed: "bg-niebla/15",
  },
];

export function TabAsistencia({ closed = false, upcoming = false, juntadaId, groupId }: TabAsistenciaProps) {
  const [rsvpStatus, setRsvpStatus] = useState<RSVPStatus>("none");
  const [members, setMembers] = useState<Member[]>([]);
  const [checks, setChecks] = useState<boolean[]>([]);
  const [editing, setEditing] = useState(false);
  const [guests, setGuests] = useState<GuestMember[]>([]);
  const [guestChecks, setGuestChecks] = useState<boolean[]>([]);
  const [guestInput, setGuestInput] = useState("");
  const [showGuestInput, setShowGuestInput] = useState(false);

  const load = useCallback(async () => {
    if (!groupId) return;
    const supabase = createClient();

    const [membersResult, guestsResult] = await Promise.all([
      supabase.from("group_members").select("user_id").eq("group_id", groupId),
      supabase.from("event_guests").select("id, name").eq("event_id", juntadaId),
    ]);

    const memberUserIds = (membersResult.data ?? []).map(m => m.user_id);
    const { data: profilesData } = await supabase.from("profiles").select("id, name").in("id", memberUserIds);
    const profileMap = Object.fromEntries((profilesData ?? []).map(p => [p.id, p.name]));

    const memberList: Member[] = (membersResult.data ?? []).map((m, i) => ({
      id: m.user_id,
      name: profileMap[m.user_id] ?? "Usuario",
      colorIndex: i,
    }));
    setMembers(memberList);

    const guestList: GuestMember[] = (guestsResult.data ?? []).map(g => ({ id: g.id, name: g.name }));
    setGuests(guestList);
    setGuestChecks(guestList.map(() => false));

    if (upcoming) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("event_rsvps")
          .select("response")
          .eq("event_id", juntadaId)
          .eq("user_id", user.id)
          .single();
        if (data?.response) setRsvpStatus(data.response as RSVPStatus);
      }
    } else {
      const { data: attendanceRaw } = await supabase
        .from("event_attendance")
        .select("user_id")
        .eq("event_id", juntadaId);
      const attendedIds = new Set((attendanceRaw ?? []).map(a => a.user_id));
      setChecks(memberList.map(m => attendedIds.has(m.id)));
    }
  }, [juntadaId, groupId, upcoming]);

  useEffect(() => { load(); }, [load]);

  const handleRSVP = async (newStatus: RSVPStatus) => {
    setRsvpStatus(newStatus);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (newStatus === "none") {
      await supabase.from("event_rsvps").delete()
        .eq("event_id", juntadaId).eq("user_id", user.id);
    } else {
      await supabase.from("event_rsvps").upsert(
        { event_id: juntadaId, user_id: user.id, response: newStatus },
        { onConflict: "event_id,user_id" }
      );
    }
  };

  const toggle = (i: number) => {
    if (!editing) return;
    setChecks(prev => prev.map((v, idx) => idx === i ? !v : v));
  };

  const toggleGuest = (i: number) => {
    if (!editing) return;
    setGuestChecks(prev => prev.map((v, idx) => idx === i ? !v : v));
  };

  const handleConfirm = async () => {
    const supabase = createClient();
    const attendedIds = members.filter((_, i) => checks[i]).map(m => m.id);
    await supabase.from("event_attendance").delete().eq("event_id", juntadaId);
    if (attendedIds.length > 0) {
      await supabase.from("event_attendance").insert(
        attendedIds.map(userId => ({ event_id: juntadaId, user_id: userId }))
      );
    }
    setEditing(false);
  };

  const handleAddGuest = async () => {
    const trimmed = guestInput.trim();
    if (!trimmed) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("event_guests")
      .insert({ event_id: juntadaId, name: trimmed })
      .select("id, name")
      .single();
    if (data) {
      setGuests(prev => [...prev, { id: data.id, name: data.name }]);
      setGuestChecks(prev => [...prev, false]);
    }
    setGuestInput("");
    setShowGuestInput(false);
  };

  const handleRemoveGuest = async (guestId: string, index: number) => {
    const supabase = createClient();
    await supabase.from("event_guests").delete().eq("id", guestId);
    setGuests(prev => prev.filter(g => g.id !== guestId));
    setGuestChecks(prev => prev.filter((_, i) => i !== index));
  };

  const count = checks.filter(Boolean).length + guestChecks.filter(Boolean).length;
  const total = members.length + guests.length;

  // ─── Juntada próxima: mostrar RSVP ───────────────────────────────────────
  if (upcoming) {
    const currentChip = RSVP_CHIPS.find(c => c.id === rsvpStatus);
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
            {RSVP_CHIPS.map(chip => {
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
          {count} de {total} fueron
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

      {members.map((m, i) => (
        <div
          key={m.id}
          onClick={() => toggle(i)}
          className={`
            flex items-center gap-3 py-3
            ${editing ? "cursor-pointer" : ""}
            ${i > 0 ? "border-t border-white/[0.04]" : ""}
          `}
        >
          <Avatar name={m.name} colorIndex={m.colorIndex} />
          <span className="flex-1 text-[15px] text-humo">{m.name}</span>
          {editing ? (
            <div className={`w-11 h-6 rounded-full relative transition-colors ${checks[i] ? "bg-fuego" : "bg-niebla/30"}`}>
              <div className={`w-[18px] h-[18px] rounded-full bg-white absolute top-[3px] transition-[left] ${checks[i] ? "left-[21px]" : "left-[3px]"}`} />
            </div>
          ) : (
            <span className={`text-[13px] font-medium ${checks[i] ? "text-exito" : "text-niebla"}`}>
              {checks[i] ? "✅ Fue" : "❌ No fue"}
            </span>
          )}
        </div>
      ))}

      {guests.length > 0 && (
        <div className="mt-1 border-t border-white/[0.04]">
          {guests.map((g, i) => (
            <div
              key={g.id}
              onClick={() => toggleGuest(i)}
              className={`flex items-center gap-3 py-3 ${editing ? "cursor-pointer" : ""}`}
            >
              <Avatar name={g.name} colorIndex={3} />
              <span className="flex-1 text-[15px] text-humo">{g.name}</span>
              <span className="text-[10px] text-niebla/50 bg-white/[0.06] px-1.5 py-0.5 rounded-full">
                invitado
              </span>
              {!closed && (
                <button
                  onClick={e => { e.stopPropagation(); handleRemoveGuest(g.id, i); }}
                  className="text-niebla/40 hover:text-fuego bg-transparent border-none cursor-pointer p-1 transition-colors"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!closed && (
        <div className="mt-3">
          {showGuestInput ? (
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={guestInput}
                onChange={e => setGuestInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddGuest()}
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
    </div>
  );
}
