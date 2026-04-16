"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { MOCK_MEMBERS } from "@/lib/constants";

interface AddAporteSheetProps {
  open: boolean;
  onClose: () => void;
  onAdd: (memberId: string, what: string) => void;
}

export function AddAporteSheet({ open, onClose, onAdd }: AddAporteSheetProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [what, setWhat] = useState("");

  if (!open) return null;

  const handleAdd = () => {
    if (!selectedId || !what.trim()) return;
    onAdd(selectedId, what.trim());
    setSelectedId(null);
    setWhat("");
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-noche-media rounded-t-[20px] px-5 pb-8 pt-3">
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 rounded-full bg-niebla/30" />
        </div>

        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-bold text-xl text-humo">Nuevo aporte</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-transparent border-none cursor-pointer text-niebla hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-niebla mb-2 block">¿Quién aportó?</label>
            <div className="flex flex-wrap gap-2">
              {MOCK_MEMBERS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-xl border-none cursor-pointer transition-all
                    ${selectedId === m.id
                      ? "bg-fuego/15 ring-2 ring-fuego/40"
                      : "bg-white/5 hover:bg-white/10"
                    }
                  `}
                >
                  <Avatar emoji={m.emoji} name={m.name} colorIndex={m.colorIndex} size="sm" />
                  <span className="text-[13px] font-medium text-humo">{m.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-niebla mb-1 block">¿Qué aportó?</label>
            <input
              type="text"
              value={what}
              onChange={(e) => setWhat(e.target.value)}
              placeholder="Ej: Puso la casa, llevó el hielo..."
              className="
                w-full px-3.5 py-3 rounded-[10px]
                border-[1.5px] border-white/[0.08]
                bg-noche text-[15px] text-humo
                placeholder:text-niebla/50 outline-none font-body
                focus:border-fuego/50 transition-colors
              "
            />
          </div>

          <Button
            full
            big
            onClick={handleAdd}
            disabled={!selectedId || !what.trim()}
          >
            Agregar aporte
          </Button>
        </div>
      </div>
    </>
  );
}
