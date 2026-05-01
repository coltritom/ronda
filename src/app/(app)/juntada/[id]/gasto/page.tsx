"use client";

import { use, useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { fmtARS } from "@/lib/utils";
import { createClient } from "@/lib/supabase/clients";

interface Participant {
  id: string;
  name: string;
  colorIndex: number;
}

function GastoContent({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const editId = searchParams.get("edit"); // expense UUID or null

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [amount, setAmount] = useState("");
  const [payerIdx, setPayerIdx] = useState(0);
  const [selected, setSelected] = useState<boolean[]>([]);
  const [allSelected, setAllSelected] = useState(true);
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();

    const { data: eventData } = await supabase
      .from("events")
      .select("group_id")
      .eq("id", id)
      .single();

    if (!eventData?.group_id) { setLoading(false); return; }

    const { data: membersRaw } = await supabase
      .from("group_members")
      .select("user_id, profiles(name)")
      .eq("group_id", eventData.group_id);

    const memberList: Participant[] = (membersRaw ?? []).map((m, i) => {
      const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
      return { id: m.user_id, name: (p as { name: string } | null)?.name ?? "Usuario", colorIndex: i };
    });
    setParticipants(memberList);

    if (editId) {
      const [expenseResult, splitsResult] = await Promise.all([
        supabase.from("expenses").select("description, amount, paid_by").eq("id", editId).single(),
        supabase.from("expense_splits").select("user_id").eq("expense_id", editId),
      ]);
      if (expenseResult.data) {
        const e = expenseResult.data;
        setAmount(String(Math.round(e.amount ?? 0)));
        setDesc(e.description === "Sin descripción" ? "" : e.description ?? "");
        const payerIndex = memberList.findIndex(m => m.id === e.paid_by);
        setPayerIdx(payerIndex >= 0 ? payerIndex : 0);
        const splitIds = new Set((splitsResult.data ?? []).map(s => s.user_id));
        const sel = memberList.map(m => splitIds.has(m.id));
        setSelected(sel);
        setAllSelected(sel.every(Boolean));
      }
    } else {
      setSelected(memberList.map(() => true));
      setAllSelected(true);
    }

    setLoading(false);
  }, [id, editId]);

  useEffect(() => { load(); }, [load]);

  const toggleMember = (i: number) => {
    const next = selected.map((v, idx) => idx === i ? !v : v);
    setSelected(next);
    setAllSelected(next.every(Boolean));
  };

  const toggleAll = () => {
    const newVal = !allSelected;
    setAllSelected(newVal);
    setSelected(participants.map(() => newVal));
  };

  const numericAmount = amount ? parseInt(amount.replace(/\D/g, ""), 10) : 0;
  const formattedAmount = numericAmount > 0 ? fmtARS(numericAmount) : "";
  const selectedCount = selected.filter(Boolean).length;
  const perPerson = numericAmount > 0 && selectedCount > 0 ? Math.round(numericAmount / selectedCount) : 0;

  const handleSave = async () => {
    if (numericAmount <= 0 || !participants.length || selectedCount === 0) return;
    const supabase = createClient();
    const payer = participants[payerIdx];
    const splitIds = participants.filter((_, i) => selected[i]).map(m => m.id);

    if (editId) {
      await supabase.from("expenses").update({
        description: desc || "Sin descripción",
        amount: numericAmount,
        paid_by: payer.id,
      }).eq("id", editId);
      await supabase.from("expense_splits").delete().eq("expense_id", editId);
      const splitAmount = Math.round(numericAmount / splitIds.length * 100) / 100;
      await supabase.from("expense_splits").insert(
        splitIds.map(userId => ({ expense_id: editId, user_id: userId, amount: splitAmount, is_settled: false }))
      );
    } else {
      await supabase.rpc("create_expense_with_splits", {
        p_event_id: id,
        p_description: desc || "Sin descripción",
        p_amount: numericAmount,
        p_paid_by: payer.id,
        p_split_type: "equal",
        p_split_user_ids: splitIds,
      });
    }
    router.back();
  };

  if (loading) return null;

  return (
    <div className="max-w-lg mx-auto pb-8">
      <div className="px-4 md:px-6 pt-4 pb-2 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-fuego text-[13px] font-semibold bg-transparent border-none cursor-pointer p-0"
        >
          <ChevronLeft size={16} />
          Volver
        </button>
        <span className="font-display font-bold text-lg text-humo">
          {editId ? "Editar gasto" : "Nuevo gasto"}
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
              value={formattedAmount}
              onChange={e => setAmount(e.target.value.replace(/\D/g, ""))}
              placeholder="0"
              className="bg-transparent border-none outline-none font-display font-bold text-[40px] text-humo text-center placeholder:text-niebla/30"
              style={{ width: Math.max(48, (formattedAmount.length || 1) * 28) }}
            />
          </div>
        </div>

        {/* Quién pagó */}
        <div>
          <p className="text-[13px] text-niebla mb-2">¿Quién pagó?</p>
          <div className="flex gap-3 flex-wrap">
            {participants.map((m, i) => (
              <div key={m.id} onClick={() => setPayerIdx(i)} className="flex flex-col items-center gap-1 cursor-pointer">
                <Avatar name={m.name} colorIndex={m.colorIndex} selected={payerIdx === i} />
                <span className={`text-[11px] font-medium ${payerIdx === i ? "text-fuego font-semibold" : "text-niebla"}`}>
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
            {participants.map((m, i) => (
              <button
                key={m.id}
                onClick={() => toggleMember(i)}
                className={`
                  flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full border-none cursor-pointer transition-all
                  ${selected[i] ? "bg-fuego/[0.12] ring-1 ring-fuego/30" : "bg-white/5 opacity-50"}
                `}
              >
                <Avatar name={m.name} colorIndex={m.colorIndex} size="sm" />
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
          onChange={e => setDesc(e.target.value)}
          placeholder="¿Qué fue? (opcional)"
          className="
            w-full px-3.5 py-3 rounded-[10px]
            border-[1.5px] border-white/[0.08]
            bg-noche-media text-[15px] text-humo
            placeholder:text-niebla outline-none font-body
          "
        />

        <Button full disabled={numericAmount <= 0 || selectedCount === 0} onClick={handleSave}>
          {editId ? "Guardar cambios" : "Agregar gasto"}
        </Button>
      </div>
    </div>
  );
}

export default function GastoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={null}>
      <GastoContent id={id} />
    </Suspense>
  );
}
