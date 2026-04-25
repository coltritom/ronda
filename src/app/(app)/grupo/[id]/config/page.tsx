"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Copy, Check, Crown, UserMinus, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { getGroup } from "@/lib/constants";

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`
        w-11 h-6 rounded-full border-none cursor-pointer relative transition-colors shrink-0
        ${checked ? "bg-fuego" : "bg-niebla/30"}
      `}
    >
      <div
        className={`
          w-[18px] h-[18px] rounded-full bg-white absolute top-[3px] transition-[left]
          ${checked ? "left-[21px]" : "left-[3px]"}
        `}
      />
    </button>
  );
}

const RANKING_OPTIONS = [
  { id: "presente", label: "🏆 El más presente", default: true },
  { id: "billetera", label: "💰 La billetera del grupo", default: true },
  { id: "mvp", label: "🏅 MVP de la ronda", default: true },
  { id: "anfitrion", label: "🏠 Anfitrión/a de oro", default: true },
  { id: "fantasma", label: "👻 Fantasma oficial", default: true },
  { id: "tarde", label: "⏰ Siempre tarde al split", default: true },
  { id: "deudor", label: "😅 Deudor/a serial", default: false },
];

export default function GroupConfigPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const group = getGroup(id);
  const [copied, setCopied] = useState(false);
  const [rankings, setRankings] = useState(
    RANKING_OPTIONS.reduce((acc, r) => ({ ...acc, [r.id]: r.default }), {} as Record<string, boolean>)
  );
  const [groupName, setGroupName] = useState(group?.name ?? "");
  const [groupEmoji] = useState(group?.emoji ?? "🔥");

  if (!group) {
    return (
      <div className="max-w-lg mx-auto px-4 md:px-6 pt-8 pb-8 text-center">
        <p className="text-sm text-niebla mb-4">Grupo no encontrado.</p>
        <a href="/home" className="text-fuego text-sm font-semibold">Ir al inicio</a>
      </div>
    );
  }

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleRanking = (rankId: string) => {
    setRankings((prev) => ({ ...prev, [rankId]: !prev[rankId] }));
  };

  return (
    <div className="max-w-lg mx-auto pb-8">
      {/* Header */}
      <div className="px-4 md:px-6 pt-4 pb-4">
        <button
          onClick={() => router.push(`/grupo/${id}`)}
          className="flex items-center gap-1 text-fuego text-[13px] font-semibold bg-transparent border-none cursor-pointer p-0 mb-3"
        >
          <ChevronLeft size={16} />
          {group.name}
        </button>
        <h1 className="font-display font-bold text-[22px] text-humo">
          Configuración del grupo
        </h1>
      </div>

      <div className="px-4 md:px-6 flex flex-col gap-3">
        {/* Info del grupo */}
        <div className="bg-noche-media rounded-2xl p-4">
          <p className="text-[11px] font-semibold text-niebla uppercase tracking-wider mb-3">
            Info del grupo
          </p>
          <div className="flex gap-3 items-center mb-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-2xl cursor-pointer">
              {groupEmoji}
            </div>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none font-display font-semibold text-lg text-humo"
            />
          </div>
        </div>

        {/* Link de invitación */}
        <div className="bg-noche-media rounded-2xl p-4">
          <p className="text-[11px] font-semibold text-niebla uppercase tracking-wider mb-3">
            Invitación
          </p>
          <p className="text-sm text-niebla mb-3">
            Mandá este link al grupo de WhatsApp para que se sumen.
          </p>
          <button
            onClick={handleCopy}
            className={`
              w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm
              border-none cursor-pointer transition-colors
              ${copied ? "bg-exito/10 text-exito" : "bg-fuego/10 text-fuego hover:bg-fuego/15"}
            `}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Link copiado. Mandalo al grupo." : "Copiar link de invitación"}
          </button>
        </div>

        {/* Miembros */}
        <div className="bg-noche-media rounded-2xl p-4">
          <p className="text-[11px] font-semibold text-niebla uppercase tracking-wider mb-3">
            Miembros · {group.members.length}
          </p>
          {group.members.map((m, i) => {
            const isAdmin = i === 0;
            return (
              <div
                key={m.id}
                className={`flex items-center gap-3 py-2.5 ${i > 0 ? "border-t border-white/[0.04]" : ""}`}
              >
                <Avatar emoji={m.emoji} name={m.name} colorIndex={m.colorIndex} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[15px] text-humo font-medium">{m.name}</span>
                    {isAdmin && (
                      <span className="flex items-center gap-0.5 text-[10px] text-ambar font-semibold bg-ambar/10 px-1.5 py-0.5 rounded-full">
                        <Crown size={10} />
                        Admin
                      </span>
                    )}
                  </div>
                </div>
                {!isAdmin && (
                  <button className="text-niebla bg-transparent border-none cursor-pointer p-1 hover:text-error transition-colors">
                    <UserMinus size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Rankings y etiquetas */}
        <div className="bg-noche-media rounded-2xl p-4">
          <p className="text-[11px] font-semibold text-niebla uppercase tracking-wider mb-1">
            Rankings y etiquetas
          </p>
          <p className="text-xs text-niebla mb-3">
            Elegí qué rankings se muestran en este grupo.
          </p>
          {RANKING_OPTIONS.map((r, i) => (
            <div
              key={r.id}
              className={`flex items-center justify-between py-2.5 ${i > 0 ? "border-t border-white/[0.04]" : ""}`}
            >
              <span className="text-sm text-humo">{r.label}</span>
              <Toggle checked={rankings[r.id]} onChange={() => toggleRanking(r.id)} />
            </div>
          ))}
        </div>

        {/* Zona peligrosa */}
        <div className="bg-noche-media rounded-2xl p-4 mt-2">
          <p className="text-[11px] font-semibold text-error uppercase tracking-wider mb-3">
            Zona peligrosa
          </p>
          <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-error bg-error/10 border-none cursor-pointer hover:bg-error/15 transition-colors">
            <Trash2 size={16} />
            Salir del grupo
          </button>
          <p className="text-xs text-niebla text-center mt-2">
            No vas a poder volver sin una invitación nueva.
          </p>
        </div>
      </div>
    </div>
  );
}
