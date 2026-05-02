"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { LugarSelector } from "@/components/juntada/LugarSelector";
import { X } from "lucide-react";
import { LUGAR_OPTIONS, type LugarId } from "@/lib/constants";
import { createClient } from "@/lib/supabase/clients";

interface Member {
  id: string;
  name: string;
  emoji: string;
  colorIndex: number;
}

interface CreateJuntadaSheetProps {
  open: boolean;
  onClose: () => void;
  groupId: string;
  groupName?: string;
  onCreated?: () => void;
}

export function CreateJuntadaSheet({ open, onClose, groupId, groupName, onCreated }: CreateJuntadaSheetProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [lugar, setLugar] = useState<LugarId | null>(null);
  const [hostId, setHostId] = useState<string | null>(null);
  const [customLocation, setCustomLocation] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !groupId) return;
    async function loadMembers() {
      const supabase = createClient();
      const { data } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", groupId);
      const userIds = (data ?? []).map(m => m.user_id);
      const { data: profilesData } = await supabase.from("profiles").select("id, name").in("id", userIds);
      const profileMap = Object.fromEntries((profilesData ?? []).map(p => [p.id, p.name]));
      setMembers(
        (data ?? []).map((m, i) => ({
          id: m.user_id,
          name: profileMap[m.user_id] ?? "Miembro",
          emoji: "",
          colorIndex: i,
        }))
      );
    }
    loadMembers();
  }, [open, groupId]);

  if (!open) return null;

  const resetForm = () => {
    setName("");
    setDate("");
    setTime("");
    setLugar(null);
    setHostId(null);
    setCustomLocation("");
    setError("");
  };

  const buildLocation = (): string | null => {
    if (!lugar) return null;
    const lugarOption = LUGAR_OPTIONS.find((l) => l.id === lugar);
    if (!lugarOption) return null;
    if (lugar === "casa") {
      if (hostId && hostId !== "otro") {
        const host = members.find((m) => m.id === hostId);
        return host ? `${lugarOption.emoji} En lo de ${host.name}` : lugarOption.label;
      }
      if (hostId === "otro" && customLocation) return customLocation;
      return lugarOption.label;
    }
    if (lugar === "otro") return customLocation || lugarOption.label;
    return lugarOption.label;
  };

  const handleCreate = async () => {
    if (!date) { setError("La fecha es obligatoria."); return; }
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("No autenticado."); setLoading(false); return; }

    // Build ISO datetime: combine date + time, or use noon as default
    const isoDate = time ? `${date}T${time}:00` : `${date}T12:00:00`;
    const location = buildLocation();

    const { data: event, error: insertError } = await supabase
      .from("events")
      .insert({
        name: name.trim() || (groupName ? `Juntada de ${groupName}` : "Juntada"),
        date: isoDate,
        group_id: groupId,
        created_by: user.id,
        status: "upcoming",
        ...(location ? { location } : {}),
      })
      .select("id")
      .single();

    setLoading(false);

    if (insertError || !event) {
      setError("No se pudo crear la juntada. Intentá de nuevo.");
      return;
    }

    onCreated?.();
    resetForm();
    onClose();
    router.push(`/grupo/${groupId}`);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[60]" onClick={handleClose} />

      <div className="fixed bottom-0 left-0 right-0 z-[60] bg-noche-media rounded-t-[20px] pt-3 max-h-[90vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center mb-4 shrink-0">
          <div className="w-10 h-1 rounded-full bg-niebla/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-5 px-5 shrink-0">
          <h3 className="font-display font-bold text-xl text-humo">Nueva juntada</h3>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-transparent border-none cursor-pointer text-niebla hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5">
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
              members={members}
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

            {error && <p className="text-[13px] text-error font-medium">{error}</p>}
          </div>
        </div>

        {/* Sticky button */}
        <div className="px-5 pt-3 shrink-0" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 2rem))' }}>
          <Button full big onClick={handleCreate} disabled={!date || loading}>
            {loading ? "Creando..." : "Crear juntada"}
          </Button>
        </div>
      </div>
    </>
  );
}
