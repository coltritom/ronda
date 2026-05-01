"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { X } from "lucide-react";
import { createGroup } from "@/lib/actions/groups";

const EMOJIS = ["🔥", "⚽", "🏖️", "🎮", "🍕", "🍺", "🎯", "🏀", "🎸", "🏠"];

interface CreateGroupSheetProps {
  open: boolean;
  onClose: () => void;
}

export function CreateGroupSheet({ open, onClose }: CreateGroupSheetProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🔥");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Ponele un nombre al grupo.");
      return;
    }
    setLoading(true);
    const result = await createGroup(name.trim(), null, emoji);
    setLoading(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onClose();
    router.push(`/grupo/${result.groupId}`);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[60]" onClick={onClose} />

      <div className="fixed bottom-0 left-0 right-0 z-[60] bg-noche-media rounded-t-[20px] pt-3 max-h-[90vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center mb-4 shrink-0">
          <div className="w-10 h-1 rounded-full bg-niebla/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-5 px-5 shrink-0">
          <h3 className="font-display font-bold text-xl text-humo">Nuevo grupo</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-transparent border-none cursor-pointer text-niebla hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-noche flex items-center justify-center text-3xl ring-2 ring-fuego/20">
              {emoji}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`
                  w-10 h-10 rounded-xl flex items-center justify-center text-lg
                  border-none cursor-pointer transition-all
                  ${emoji === e ? "bg-fuego/15 ring-2 ring-fuego/40" : "bg-white/5"}
                `}
              >
                {e}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
            placeholder="Ponele nombre. Algo que todos reconozcan."
            className="
              w-full px-4 py-3 rounded-[10px] mb-2
              border-[1.5px] border-white/[0.08]
              bg-noche
              text-[15px] text-humo
              placeholder:text-niebla/50
              outline-none font-body
              focus:border-fuego/50 transition-colors
            "
          />
          {error && <p className="text-[13px] text-error font-medium mb-2">{error}</p>}
        </div>

        {/* Sticky button */}
        <div className="px-5 pt-3 shrink-0" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 2rem))' }}>
          <Button full big onClick={handleCreate} disabled={loading}>
            {loading ? "Creando..." : "Crear grupo"}
          </Button>
        </div>
      </div>
    </>
  );
}
