"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { LugarSelector } from "@/components/juntada/LugarSelector";
import { X } from "lucide-react";
import { MOCK_MEMBERS, LUGAR_OPTIONS, type LugarId } from "@/lib/constants";

interface CreateJuntadaSheetProps {
  open: boolean;
  onClose: () => void;
  groupId: string;
  onCreated?: (juntada: any) => void;
}

export function CreateJuntadaSheet({ open, onClose, groupId, onCreated }: CreateJuntadaSheetProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [lugar, setLugar] = useState<LugarId | null>(null);
  const [hostId, setHostId] = useState<string | null>(null);
  const [customLocation, setCustomLocation] = useState("");

  if (!open) return null;

  const resetForm = () => {
    setName("");
    setDate("");
    setTime("");
    setLugar(null);
    setHostId(null);
    setCustomLocation("");
  };

  const handleCreate = () => {
    const newId = `j-${Date.now()}`;
    const hostMember = MOCK_MEMBERS.find((m) => m.id === hostId);
    const lugarOption = lugar ? LUGAR_OPTIONS.find((l) => l.id === lugar) : null;

    const newJuntada = {
      id: newId,
      name: name || undefined,
      date: date || new Date().toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" }),
      time,
      lugar,
      hostId: lugar === "casa" ? hostId : null,
      hostName: lugar === "casa" && hostId && hostId !== "otro" ? hostMember?.name : undefined,
      customLocation: (lugar === "otro" || hostId === "otro") ? customLocation : null,
      attendees: 0,
      totalSpent: 0,
      closed: false,
    };

    // Formatear fecha legible para URL params
    let displayDate = "";
    if (date) {
      const [year, month, day] = date.split("-").map(Number);
      const d = new Date(year, month - 1, day);
      displayDate = d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    }
    if (time) displayDate = displayDate ? `${displayDate}, ${time}` : time;

    // Lugar legible
    const hostName = lugar === "casa" && hostId && hostId !== "otro" ? hostMember?.name : null;
    const lugarDisplay = lugarOption
      ? (hostName ? `${lugarOption.emoji} En lo de ${hostName}` : `${lugarOption.emoji} ${customLocation && (lugar === "otro" || hostId === "otro") ? customLocation : lugarOption.label}`)
      : null;

    const params = new URLSearchParams();
    if (name) params.set("n", name);
    if (displayDate) params.set("d", displayDate);
    if (lugarDisplay) params.set("l", lugarDisplay);

    onCreated?.(newJuntada);
    resetForm();
    onClose();
    router.push(`/juntada/${newId}?${params.toString()}`);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={handleClose} />

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-noche-media rounded-t-[20px] px-5 pb-8 pt-3 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 rounded-full bg-niebla/30" />
        </div>

        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-xl text-humo">Nueva juntada</h3>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-transparent border-none cursor-pointer text-niebla hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-niebla mb-1.5 block">
              Nombre (opcional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ponele nombre si querés (o dejalo así)"
              className="
                w-full px-3.5 py-3 rounded-[10px]
                border-[1.5px] border-white/[0.08]
                bg-noche text-[15px] text-humo
                placeholder:text-niebla/50 outline-none font-body
                focus:border-fuego/50 transition-colors
              "
            />
          </div>

          <LugarSelector
            selected={lugar}
            onSelect={setLugar}
            hostId={hostId}
            onHostSelect={setHostId}
            members={MOCK_MEMBERS}
            customName={customLocation}
            onCustomNameChange={setCustomLocation}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-niebla mb-1.5 block">
                ¿Cuándo? <span className="text-fuego">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className={`
                  w-full px-3.5 py-3 rounded-[10px]
                  border-[1.5px]
                  bg-noche text-[15px] text-humo
                  outline-none font-body focus:border-fuego/50 transition-colors
                  [color-scheme:dark]
                  ${!date ? "border-white/[0.08]" : "border-fuego/30"}
                `}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-niebla mb-1.5 block">
                Hora
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="
                  w-full px-3.5 py-3 rounded-[10px]
                  border-[1.5px] border-white/[0.08]
                  bg-noche text-[15px] text-humo
                  outline-none font-body focus:border-fuego/50 transition-colors
                  [color-scheme:dark]
                "
              />
            </div>
          </div>

          <Button full big onClick={handleCreate} disabled={!date}>Crear juntada</Button>
        </div>
      </div>
    </>
  );
}
