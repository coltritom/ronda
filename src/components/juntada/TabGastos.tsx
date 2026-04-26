"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { fmtARS } from "@/lib/utils";
import { getGastos, removeGasto, GastoEntry } from "@/lib/store";

interface TabGastosProps {
  juntadaId: string;
  isNew?: boolean;
}

const MOCK_GASTOS: GastoEntry[] = [
  { desc: "Carne y carbón", amount: 12000, who: "Mati", forAll: true },
  { desc: "Bebidas", amount: 4200, who: "Nico", forAll: true },
  { desc: "Ensaladas y pan", amount: 2000, who: "Lucía", forAll: true },
];

export function TabGastos({ juntadaId, isNew = false }: TabGastosProps) {
  const router = useRouter();
  const [gastos, setGastos] = useState<GastoEntry[]>(
    () => getGastos(juntadaId) ?? (isNew ? [] : MOCK_GASTOS)
  );

  const total = gastos.reduce((s, g) => s + g.amount, 0);

  const handleRemove = (index: number) => {
    removeGasto(juntadaId, index);
    setGastos(getGastos(juntadaId) ?? []);
  };

  if (gastos.length === 0) {
    return (
      <div className="px-4 md:px-6 py-10 text-center">
        <p className="text-sm text-niebla mb-4">
          Nadie puso un peso todavía. Alguien tiene que arrancar.
        </p>
        <Button onClick={() => router.push(`/juntada/${juntadaId}/gasto`)}>Agregar gasto</Button>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 py-4">
      {gastos.map((g, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 py-3 group ${i > 0 ? "border-t border-white/[0.04]" : ""}`}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-niebla/40 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[15px] text-humo">{g.desc}</p>
            <p className="text-xs text-niebla mt-0.5">
              Pagó {g.who} · {g.forAll ? "Para todos" : ""}
            </p>
          </div>
          <span className="font-semibold text-base text-humo shrink-0">
            ${fmtARS(g.amount)}
          </span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => router.push(`/juntada/${juntadaId}/gasto?edit=${i}`)}
              className="text-niebla bg-transparent border-none cursor-pointer p-0.5"
              title="Editar"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => handleRemove(i)}
              className="text-niebla bg-transparent border-none cursor-pointer p-0.5"
              title="Eliminar"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ))}

      <div className="flex justify-between items-center mt-3 pt-3 border-t-2 border-white/[0.08]">
        <span className="font-semibold text-sm text-niebla">Total</span>
        <span className="font-display font-bold text-xl text-humo">
          ${fmtARS(total)}
        </span>
      </div>

      <div className="mt-5">
        <Button full onClick={() => router.push(`/juntada/${juntadaId}/gasto`)}>Agregar gasto</Button>
      </div>
    </div>
  );
}
