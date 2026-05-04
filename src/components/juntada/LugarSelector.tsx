"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { LUGAR_OPTIONS, type LugarId } from "@/lib/constants";
import { Avatar } from "@/components/ui/Avatar";

interface Member {
  id: string;
  name: string;
  emoji: string;
  colorIndex: number;
}

interface LugarSelectorProps {
  selected: LugarId | null;
  onSelect: (lugar: LugarId) => void;
  hostId: string | null;
  onHostSelect: (memberId: string | null) => void;
  members: Member[];
  membersLoading?: boolean;
  customName: string;
  onCustomNameChange: (name: string) => void;
}

export function LugarSelector({
  selected, onSelect, hostId, onHostSelect, members, membersLoading, customName, onCustomNameChange,
}: LugarSelectorProps) {
  const [expanded, setExpanded] = useState(false);
  const selectedOption = LUGAR_OPTIONS.find((l) => l.id === selected);

  return (
    <div>
      <label className="text-xs font-medium text-niebla mb-1.5 block">
        ¿Dónde es?
      </label>

      {/* Selected / Trigger */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`
          w-full flex items-center justify-between px-3.5 py-3 rounded-[10px]
          border-[1.5px] transition-colors cursor-pointer text-left
          bg-noche
          ${expanded ? "border-fuego/50" : "border-white/[0.08]"}
        `}
      >
        {selectedOption ? (
          <span className="flex items-center gap-2 text-[15px] text-humo">
            <span className="text-lg">{selectedOption.emoji}</span>
            {selectedOption.label}
          </span>
        ) : (
          <span className="text-[15px] text-niebla/50">
            Elegí el tipo de lugar
          </span>
        )}
        {expanded ? (
          <ChevronUp size={18} className="text-niebla shrink-0" />
        ) : (
          <ChevronDown size={18} className="text-niebla shrink-0" />
        )}
      </button>

      {/* Options grid */}
      {expanded && (
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {LUGAR_OPTIONS.map((lugar) => (
            <button
              key={lugar.id}
              onClick={() => {
                onSelect(lugar.id);
                setExpanded(false);
                if (!lugar.needsHost) onHostSelect(null);
              }}
              className={`
                flex items-center gap-2 px-3 py-2.5 rounded-xl text-left
                border-none cursor-pointer transition-all text-sm
                ${selected === lugar.id
                  ? "bg-fuego/[0.12] text-humo ring-1 ring-fuego/30 font-medium"
                  : "bg-white/5 text-niebla hover:bg-white/10"
                }
              `}
            >
              <span className="text-base">{lugar.emoji}</span>
              <span className="truncate">{lugar.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Host selector — solo si es Casa/Depto */}
      {selected === "casa" && (
        <div className="mt-3">
          <label className="text-xs font-medium text-niebla mb-1.5 block">
            ¿En lo de quién?
          </label>
          {membersLoading ? (
            <div className="flex gap-2 flex-wrap animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-7 w-16 rounded-full bg-white/[0.06]" />
              ))}
            </div>
          ) : (
          <div className="flex gap-2 flex-wrap">
            {members.map((m) => (
              <button
                key={m.id}
                onClick={() => onHostSelect(m.id)}
                className={`
                  flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full
                  border-none cursor-pointer transition-all
                  ${hostId === m.id
                    ? "bg-fuego/[0.12] ring-1 ring-fuego/30"
                    : "bg-white/5"
                  }
                `}
              >
                <Avatar emoji={m.emoji} name={m.name} colorIndex={m.colorIndex} size="sm" />
                <span className={`
                  text-xs font-medium
                  ${hostId === m.id ? "text-humo" : "text-niebla"}
                `}>
                  {m.name}
                </span>
              </button>
            ))}
            <button
              onClick={() => onHostSelect("otro")}
              className={`
                flex items-center gap-1.5 px-3 py-1 rounded-full
                border-none cursor-pointer transition-all
                ${hostId === "otro"
                  ? "bg-fuego/[0.12] ring-1 ring-fuego/30"
                  : "bg-white/5"
                }
              `}
            >
              <span className="text-xs">📍</span>
              <span className={`
                text-xs font-medium
                ${hostId === "otro" ? "text-humo" : "text-niebla"}
              `}>
                Otro
              </span>
            </button>
          </div>
          )}

          {hostId === "otro" && (
            <input
              type="text"
              value={customName}
              onChange={(e) => onCustomNameChange(e.target.value)}
              placeholder="¿En dónde? Ej: Casa de mi viejo"
              className="
                w-full mt-2 px-3.5 py-2.5 rounded-[10px]
                border-[1.5px] border-white/[0.08]
                bg-noche text-sm text-humo
                placeholder:text-niebla/50
                outline-none font-body focus:border-fuego/50 transition-colors
              "
            />
          )}
        </div>
      )}

      {/* Input custom para "Otro" general */}
      {selected === "otro" && (
        <div className="mt-2">
          <input
            type="text"
            value={customName}
            onChange={(e) => onCustomNameChange(e.target.value)}
            placeholder="¿Dónde es? Ej: La cancha del barrio"
            className="
              w-full px-3.5 py-2.5 rounded-[10px]
              border-[1.5px] border-white/[0.08]
              bg-noche text-sm text-humo
              placeholder:text-niebla/50
              outline-none font-body focus:border-fuego/50 transition-colors
            "
          />
        </div>
      )}

      {selected === "casa" && hostId && hostId !== "otro" && (
        <p className="text-[11px] text-niebla mt-2 flex items-center gap-1">
          <span>🏠</span>
          Esto suma para el ranking de Anfitrión de oro
        </p>
      )}
    </div>
  );
}
