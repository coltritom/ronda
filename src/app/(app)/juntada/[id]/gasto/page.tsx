"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { MOCK_MEMBERS } from "@/lib/constants";
import { fmtARS } from "@/lib/utils";

export default function GastoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [payer, setPayer] = useState(0);
  const [selected, setSelected] = useState<boolean[]>(MOCK_MEMBERS.map(() => true));
  const [desc, setDesc] = useState("");
  const [allSelected, setAllSelected] = useState(true);

  const toggleMember = (i: number) => {
    const next = [...selected];
    next[i] = !next[i];
    setSelected(next);
    setAllSelected(next.every(Boolean));
  };

  const toggleAll = () => {
    const newVal = !allSelected;
    setAllSelected(newVal);
    setSelected(MOCK_MEMBERS.map(() => newVal));
  };

  const selectedCount = selected.filter(Boolean).length;
  const perPerson = amount && selectedCount > 0
    ? Math.round(parseFloat(amount) / selectedCount)
    : 0;

  return (
    <div className="max-w-lg mx-auto pb-8">
      {/* Header */}
      <div className="px-4 md:px-6 pt-4 pb-2 flex items-center justify-between">
        <button
          onClick={() => router.push(`/juntada/${id}`)}
          className="flex items-center gap-1 text-fuego text-[13px] font-semibold bg-transparent border-none cursor-pointer p-0"
        >
          <ChevronLeft size={16} />
          Volver
        </button>
        <span className="font-display font-bold text-lg text-humo">
          Nuevo gasto
        </span>
        <div className="w-[50px]" />
      </div>

      <div className="px-4 md:px-6 mt-4 flex flex-col gap-5">
        {/* Monto */}
        <div className="text-center">
          <p className="text-[13px] text-niebla mb-2">¿Cuánto fue?</p>
          <div className="flex items-center justify-center gap-0.5 font-display font-bold text-[40px] text-humo">
            <span className="opacity-40">$</span>
            <input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="0"
              className="bg-transparent border-none outline-none font-display font-bold text-[40px] text-humo text-center placeholder:text-niebla/30"
              style={{ width: Math.max(40, (amount.length || 1) * 24) }}
            />
          </div>
        </div>

        {/* Quién pagó */}
        <div>
          <p className="text-[13px] text-niebla mb-2">¿Quién pagó?</p>
          <div className="flex gap-3 flex-wrap">
            {MOCK_MEMBERS.slice(0, 6).map((m, i) => (
              <div
                key={m.id}
                onClick={() => setPayer(i)}
                className="flex flex-col items-center gap-1 cursor-pointer"
              >
                <Avatar emoji={m.emoji} name={m.name} colorIndex={m.colorIndex} selected={payer === i} />
                <span className={`text-[11px] font-medium ${payer === i ? "text-fuego font-semibold" : "text-niebla"}`}>
                  {m.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Entre quiénes */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <p className="text-[13px] text-niebla">¿Entre quiénes se divide?</p>
            <button
              onClick={toggleAll}
              className="text-xs font-semibold text-fuego bg-transparent border-none cursor-pointer"
            >
              {allSelected ? "Todos ✓" : "Seleccionar todos"}
            </button>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {MOCK_MEMBERS.slice(0, 6).map((m, i) => (
              <button
                key={m.id}
                onClick={() => toggleMember(i)}
                className={`
                  flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full border-none cursor-pointer transition-all
                  ${selected[i] ? "bg-fuego/[0.12] ring-1 ring-fuego/30" : "bg-white/5 opacity-50"}
                `}
              >
                <Avatar emoji={m.emoji} name={m.name} colorIndex={m.colorIndex} size="sm" />
                <span className={`text-xs font-medium ${selected[i] ? "text-humo" : "text-niebla"}`}>
                  {m.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* División */}
        <div className="bg-noche-media rounded-2xl p-4 flex items-center justify-between">
          <span className="text-sm text-humo">Partes iguales</span>
          <span className="text-[13px] text-niebla">
            {perPerson > 0 ? `$${fmtARS(perPerson)} c/u` : "$0 c/u"}
          </span>
        </div>

        {/* Descripción */}
        <input
          type="text"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="¿Qué fue? (opcional)"
          className="
            w-full px-3.5 py-3 rounded-[10px]
            border-[1.5px] border-white/[0.08]
            bg-noche-media
            text-[15px] text-humo
            placeholder:text-niebla
            outline-none font-body
          "
        />

        <Button full>Agregar gasto</Button>
      </div>
    </div>
  );
}
