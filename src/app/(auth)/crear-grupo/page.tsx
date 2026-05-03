"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Copy, Check, ChevronLeft } from "lucide-react";
import { createGroup } from "@/lib/actions/groups";

const EMOJIS = ["🔥", "⚽", "🏖️", "🎮", "🍕", "🍺", "🎯", "🏀", "🎸", "🏠", "🚗", "🎂"];

type Step = "create" | "invite";

export default function CrearGrupoPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("create");
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🔥");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [groupId, setGroupId] = useState("");

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
    setGroupId(result.groupId);
    setCurrentStep("invite");
  };

  const handleCopy = () => {
    const link = `${window.location.origin}/invite/${groupId}`;
    navigator.clipboard.writeText(link).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDone = () => {
    router.push(`/groups/${groupId}`);
  };

  if (currentStep === "invite") {
    return (
      <div className="w-full max-w-sm flex flex-col items-center min-h-screen justify-between py-12 px-4">
        <div className="w-full">
          <span className="font-display font-extrabold text-xl text-fuego tracking-tight">ronda</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center w-full">
          <div className="w-20 h-20 rounded-3xl bg-menta/[0.12] flex items-center justify-center mb-6">
            <span className="text-4xl">{emoji}</span>
          </div>

          <h2 className="font-display font-bold text-2xl text-humo text-center mb-2">
            Grupo creado
          </h2>
          <p className="text-[15px] text-niebla text-center mb-8 max-w-[280px]">
            Ahora mandá el link antes de que se arrepientan.
          </p>

          <div className="w-full bg-noche-media rounded-2xl p-5 mb-4">
            <p className="text-xs text-niebla mb-1">Link de invitación</p>
            <p className="text-sm text-humo font-mono break-all mb-4">
              ordenalaronda.com/invite/{groupId}
            </p>
            <button
              onClick={handleCopy}
              className={`
                w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm
                border-none cursor-pointer transition-all
                ${copied ? "bg-exito/10 text-exito" : "bg-fuego/10 text-fuego hover:bg-fuego/15"}
              `}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Link copiado. Mandalo al grupo." : "Copiar link de invitación"}
            </button>
          </div>

          <div className="w-full bg-noche-media rounded-2xl p-4 text-center">
            <p className="text-xs text-niebla mb-2">O compartilo directo</p>
            <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366]/10 text-[#25D366] font-semibold text-sm border-none cursor-pointer hover:bg-[#25D366]/15 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.325 0-4.47-.744-6.229-2.01l-.436-.327-2.645.887.887-2.645-.327-.436A9.956 9.956 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/>
              </svg>
              Compartir por WhatsApp
            </button>
          </div>
        </div>

        <div className="w-full">
          <Button full big onClick={handleDone}>Ir al grupo</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm flex flex-col items-center min-h-screen justify-between py-12 px-4">
      <div className="w-full flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-fuego text-[13px] font-semibold bg-transparent border-none cursor-pointer p-0"
        >
          <ChevronLeft size={16} />
          Atrás
        </button>
        <span className="font-display font-extrabold text-xl text-fuego tracking-tight">ronda</span>
        <div className="w-[50px]" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <h2 className="font-display font-bold text-2xl text-humo text-center mb-2">
          Nuevo grupo
        </h2>
        <p className="text-[15px] text-niebla text-center mb-8">
          Ponele nombre y elegí un emoji que lo represente.
        </p>

        <div className="mb-6">
          <div className="w-20 h-20 rounded-3xl bg-noche-media flex items-center justify-center text-4xl mx-auto mb-4 ring-2 ring-fuego/20">
            {emoji}
          </div>
          <div className="flex flex-wrap gap-2 justify-center max-w-[280px]">
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`
                  w-10 h-10 rounded-xl flex items-center justify-center text-lg
                  border-none cursor-pointer transition-all
                  ${emoji === e ? "bg-fuego/15 ring-2 ring-fuego/40" : "bg-white/5 hover:bg-white/10"}
                `}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full">
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
            placeholder="Ponele nombre. Algo que todos reconozcan."
            className="
              w-full px-4 py-3.5 rounded-2xl
              border-[1.5px] border-white/[0.08]
              bg-noche-media
              text-base text-humo text-center
              placeholder:text-niebla/50
              outline-none font-body
              focus:border-fuego/50 transition-colors
            "
          />
          {error && (
            <p className="text-[13px] text-error font-medium text-center mt-2">{error}</p>
          )}
        </div>
      </div>

      <div className="w-full">
        <Button full big onClick={handleCreate} disabled={loading}>
          {loading ? "Creando..." : "Crear grupo"}
        </Button>
      </div>
    </div>
  );
}
