"use client";

import { useState, useEffect, useCallback } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { fmtARSExact } from "@/lib/utils";
import { ConfirmPagoModal } from "@/components/juntada/ConfirmPagoModal";
import { createClient } from "@/lib/supabase/clients";
import type { UIMember, UIDebt } from "@/types";

function simplifyDebts(splits: Array<{ user_id: string; amount: number; paid_by: string }>): UIDebt[] {
  const balance: Record<string, number> = {};
  for (const s of splits) {
    balance[s.paid_by] = (balance[s.paid_by] ?? 0) + s.amount;
    balance[s.user_id] = (balance[s.user_id] ?? 0) - s.amount;
  }
  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];
  for (const [id, bal] of Object.entries(balance)) {
    if (bal > 0.01) creditors.push({ id, amount: bal });
    else if (bal < -0.01) debtors.push({ id, amount: -bal });
  }
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const result: UIDebt[] = [];
  let ci = 0, di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const credit = creditors[ci];
    const debt = debtors[di];
    const amount = Math.min(credit.amount, debt.amount);
    result.push({ fromId: debt.id, toId: credit.id, amount: Math.round(amount * 100) / 100 });
    credit.amount -= amount;
    debt.amount -= amount;
    if (credit.amount < 0.01) ci++;
    if (debt.amount < 0.01) di++;
  }
  return result;
}

function GuestBadge() {
  return (
    <span className="ml-1 text-[10px] font-normal text-niebla/50 bg-white/[0.06] px-1.5 py-0.5 rounded-full align-middle">
      invitado
    </span>
  );
}

interface Props {
  closed?: boolean;
  juntadaId: string;
  juntadaName?: string;
  groupId: string;
}

export function TabCuentas({ closed = false, juntadaId, juntadaName, groupId }: Props) {
  const [members, setMembers] = useState<UIMember[]>([]);
  const [deudas, setDeudas] = useState<UIDebt[]>([]);
  const [expensesByPayer, setExpensesByPayer] = useState<Record<string, string[]>>({});
  const [confirmDeuda, setConfirmDeuda] = useState<UIDebt | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [hasExpenses, setHasExpenses] = useState(false);

  const load = useCallback(async () => {
    if (!groupId) return;
    const supabase = createClient();

    const [membersResult, guestsResult, expensesResult] = await Promise.all([
      supabase.from("group_members").select("user_id").eq("group_id", groupId),
      supabase.from("event_guests").select("id, name").eq("event_id", juntadaId),
      supabase.from("expenses").select("id, paid_by").eq("event_id", juntadaId),
    ]);

    const memberUserIds = (membersResult.data ?? []).map(m => m.user_id);
    const { data: profilesData } = await supabase.from("profiles").select("id, name").in("id", memberUserIds);
    const profileMap = Object.fromEntries((profilesData ?? []).map(p => [p.id, p.name]));

    const memberList: UIMember[] = (membersResult.data ?? []).map((m, i) => ({
      id: m.user_id,
      name: profileMap[m.user_id] ?? "Usuario",
      colorIndex: i,
    }));
    const guestList: UIMember[] = (guestsResult.data ?? []).map((g, i) => ({
      id: g.id, name: g.name, colorIndex: (memberList.length + i) % 8, isGuest: true,
    }));
    setMembers([...memberList, ...guestList]);

    const expensesRaw = expensesResult.data ?? [];
    setHasExpenses(expensesRaw.length > 0);
    if (!expensesRaw.length) { setLoaded(true); return; }

    const byPayer: Record<string, string[]> = {};
    for (const e of expensesRaw) {
      if (!byPayer[e.paid_by]) byPayer[e.paid_by] = [];
      byPayer[e.paid_by].push(e.id);
    }
    setExpensesByPayer(byPayer);

    const expenseMap: Record<string, string> = {};
    for (const e of expensesRaw) expenseMap[e.id] = e.paid_by;

    const { data: splitsRaw } = await supabase
      .from("expense_splits")
      .select("expense_id, user_id, amount")
      .in("expense_id", expensesRaw.map(e => e.id))
      .eq("is_settled", false);

    const debtData = (splitsRaw ?? [])
      .map(s => ({ user_id: s.user_id, amount: s.amount ?? 0, paid_by: expenseMap[s.expense_id] }))
      .filter(s => s.paid_by && s.user_id !== s.paid_by);

    setDeudas(simplifyDebts(debtData));
    setLoaded(true);
  }, [juntadaId, groupId]);

  useEffect(() => { load(); }, [load]);

  const handleConfirmPaid = async () => {
    if (!confirmDeuda) return;
    const { fromId, toId } = confirmDeuda;
    const supabase = createClient();
    const expensesOfTo = expensesByPayer[toId] ?? [];
    const expensesOfFrom = expensesByPayer[fromId] ?? [];
    if (expensesOfTo.length > 0) {
      await supabase.from("expense_splits").update({ is_settled: true })
        .eq("user_id", fromId).in("expense_id", expensesOfTo);
    }
    if (expensesOfFrom.length > 0) {
      await supabase.from("expense_splits").update({ is_settled: true })
        .eq("user_id", toId).in("expense_id", expensesOfFrom);
    }
    setDeudas(prev => prev.filter(d => !(d.fromId === fromId && d.toId === toId)));
    setConfirmDeuda(null);
  };

  if (!loaded) return null;

  if (!hasExpenses) {
    return (
      <div className="px-4 md:px-6 py-10 text-center">
        <p className="text-sm text-niebla">
          Primero registrá los gastos. Después podés ver las cuentas.
        </p>
      </div>
    );
  }

  if (closed || deudas.length === 0) {
    return (
      <div className="px-4 md:px-6 py-10 text-center">
        <div className="w-14 h-14 rounded-full bg-menta/[0.12] flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl">✓</span>
        </div>
        <p className="font-semibold text-base text-humo">Cuentas cerradas</p>
        <p className="text-sm text-niebla mt-1">Amistad preservada.</p>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 py-4">
      <p className="text-sm text-niebla mb-4">Así quedaron los números.</p>
      <div className="flex flex-col gap-3">
        {deudas.map((d, i) => {
          const from = members.find(m => m.id === d.fromId);
          const to = members.find(m => m.id === d.toId);
          if (!from || !to) return null;
          return (
            <div key={`${d.fromId}-${d.toId}-${i}`} className="bg-noche-media rounded-2xl p-4 flex flex-col gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Avatar name={from.name} colorIndex={from.colorIndex} />
                  <span className="text-lg text-niebla">→</span>
                  <Avatar name={to.name} colorIndex={to.colorIndex} />
                </div>
                <p className="font-semibold text-[15px] text-humo">
                  {from.name}{from.isGuest && <GuestBadge />}
                  {" le debe a "}
                  {to.name}{to.isGuest && <GuestBadge />}
                </p>
                {juntadaName && <p className="text-xs text-niebla/60 mt-0.5">por {juntadaName}</p>}
              </div>
              <p className="font-bold text-[28px] text-humo leading-none">${fmtARSExact(d.amount)}</p>
              <Button primary={false} full onClick={() => setConfirmDeuda(d)}>
                Marcar como pagado
              </Button>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-niebla text-center mt-4">
        Ronda simplificó las cuentas para que haya menos transferencias.
      </p>

      {confirmDeuda && (() => {
        const from = members.find(m => m.id === confirmDeuda.fromId);
        const to = members.find(m => m.id === confirmDeuda.toId);
        if (!from || !to) return null;
        return (
          <ConfirmPagoModal
            open
            onClose={() => setConfirmDeuda(null)}
            onConfirm={handleConfirmPaid}
            from={from}
            to={to}
            amountLabel={`$${fmtARSExact(confirmDeuda.amount)}`}
          />
        );
      })()}
    </div>
  );
}
