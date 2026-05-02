"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { fmtARS } from "@/lib/utils";
import { createClient } from "@/lib/supabase/clients";

interface Expense {
  id: string;
  desc: string;
  amount: number;
  payerName: string;
  splitCount: number;
}

interface TabGastosProps {
  juntadaId: string;
}

export function TabGastos({ juntadaId }: TabGastosProps) {
  const router = useRouter();
  const [gastos, setGastos] = useState<Expense[]>([]);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: expensesRaw } = await supabase
      .from("expenses")
      .select("id, description, amount, paid_by")
      .eq("event_id", juntadaId);

    if (!expensesRaw?.length) { setGastos([]); return; }

    const payerIds = [...new Set(expensesRaw.map(e => e.paid_by))];
    const expenseIds = expensesRaw.map(e => e.id);

    const [profilesResult, splitsResult] = await Promise.all([
      supabase.from("profiles").select("id, name").in("id", payerIds),
      supabase.from("expense_splits").select("expense_id, user_id").in("expense_id", expenseIds),
    ]);

    const profileMap = Object.fromEntries((profilesResult.data ?? []).map(p => [p.id, p.name]));
    const splitCounts: Record<string, number> = {};
    for (const s of splitsResult.data ?? []) {
      splitCounts[s.expense_id] = (splitCounts[s.expense_id] ?? 0) + 1;
    }

    setGastos(expensesRaw.map(e => ({
      id: e.id,
      desc: e.description || "Sin descripción",
      amount: e.amount ?? 0,
      payerName: profileMap[e.paid_by] ?? "Usuario",
      splitCount: splitCounts[e.id] ?? 0,
    })));
  }, [juntadaId]);

  useEffect(() => { load(); }, [load]);

  const total = gastos.reduce((s, g) => s + g.amount, 0);

  const handleRemove = async (expenseId: string) => {
    const supabase = createClient();
    await supabase.from("expense_splits").delete().eq("expense_id", expenseId);
    await supabase.from("expenses").delete().eq("id", expenseId);
    setGastos(prev => prev.filter(g => g.id !== expenseId));
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
          key={g.id}
          className={`flex items-center gap-3 py-3 ${i > 0 ? "border-t border-white/[0.04]" : ""}`}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-niebla/40 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[15px] text-humo">{g.desc}</p>
            <p className="text-xs text-niebla mt-0.5">
              Pagó {g.payerName} · {g.splitCount} personas
            </p>
          </div>
          <span className="font-semibold text-base text-humo shrink-0">
            ${fmtARS(g.amount)}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => router.push(`/juntada/${juntadaId}/gasto?edit=${g.id}`)}
              className="text-niebla/50 hover:text-niebla bg-transparent border-none cursor-pointer p-1 transition-colors"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => handleRemove(g.id)}
              className="text-niebla/50 hover:text-fuego bg-transparent border-none cursor-pointer p-1 transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      ))}

      <div className="flex justify-between items-center mt-3 pt-3 border-t-2 border-white/[0.08]">
        <span className="font-semibold text-sm text-niebla">Total</span>
        <span className="font-display font-bold text-xl text-humo">${fmtARS(total)}</span>
      </div>

      <div className="mt-5">
        <Button full onClick={() => router.push(`/juntada/${juntadaId}/gasto`)}>Agregar gasto</Button>
      </div>
    </div>
  );
}
