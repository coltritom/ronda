"use client";

import { use, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { fmtARS } from "@/lib/utils";
import { ConfirmPagoModal } from "@/components/juntada/ConfirmPagoModal";
import { createClient } from "@/lib/supabase/clients";
import { useAuth } from "@/lib/supabase/auth-context";
import type { UIMember, UIDebt } from "@/types";

function simplifyDebts(
  splits: Array<{ user_id: string; amount: number; paid_by: string }>
): UIDebt[] {
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
    result.push({
      fromId: debt.id,
      toId: credit.id,
      amount: Math.round(amount * 100) / 100,
      paid: false,
    });
    credit.amount -= amount;
    debt.amount -= amount;
    if (credit.amount < 0.01) ci++;
    if (debt.amount < 0.01) di++;
  }
  return result;
}

export default function CuentasGlobalesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState<UIMember[]>([]);
  const [deudas, setDeudas] = useState<UIDebt[]>([]);
  const [confirmDeuda, setConfirmDeuda] = useState<UIDebt | null>(null);
  const user = useAuth();
  const [myUserId, setMyUserId] = useState("");

  const [expensesByPayer, setExpensesByPayer] = useState<Record<string, string[]>>({});

  const load = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    setMyUserId(user.id);

    // Phase 1: all queries that only need group id
    const [{ data: groupData }, { data: membersRaw }, { data: eventsRaw }] = await Promise.all([
      supabase.from("groups").select("id, name").eq("id", id).single(),
      supabase.from("group_members").select("user_id").eq("group_id", id),
      supabase.from("events").select("id").eq("group_id", id).neq("status", "cancelled"),
    ]);

    if (!groupData) { router.push("/groups"); return; }
    const memberUserIds = (membersRaw ?? []).map(m => m.user_id);
    if (!memberUserIds.includes(user.id)) { router.push("/groups"); return; }
    setGroupName(groupData.name);

    const eventIds = (eventsRaw ?? []).map((e) => e.id);

    // Phase 2: profiles and expenses are independent of each other
    const [{ data: profilesData }, { data: expensesRaw }] = await Promise.all([
      supabase.from("profiles").select("id, name").in("id", memberUserIds),
      eventIds.length > 0
        ? supabase.from("expenses").select("id, paid_by").in("event_id", eventIds)
        : Promise.resolve({ data: [] as { id: string; paid_by: string }[] }),
    ]);

    const profileMap = Object.fromEntries((profilesData ?? []).map(p => [p.id, p.name]));
    setMembers((membersRaw ?? []).map((m, i) => ({
      id: m.user_id,
      name: profileMap[m.user_id] ?? "Usuario",
      colorIndex: i,
    })));

    const allExpenseIds = (expensesRaw ?? []).map((e) => e.id);
    if (!eventIds.length || !allExpenseIds.length) { setLoading(false); return; }

    const byPayer: Record<string, string[]> = {};
    for (const e of expensesRaw ?? []) {
      if (!byPayer[e.paid_by]) byPayer[e.paid_by] = [];
      byPayer[e.paid_by].push(e.id);
    }
    setExpensesByPayer(byPayer);

    const expenseMap: Record<string, string> = {};
    for (const e of expensesRaw ?? []) expenseMap[e.id] = e.paid_by;

    // Phase 3: expense_splits (depends on phase 2)
    const { data: splitsRaw } = await supabase
      .from("expense_splits")
      .select("expense_id, user_id, amount")
      .in("expense_id", allExpenseIds)
      .eq("is_settled", false);

    const debtData = (splitsRaw ?? []).flatMap((s) => {
      const paidBy = expenseMap[s.expense_id];
      if (!paidBy || s.user_id === paidBy) return [];
      return [{ user_id: s.user_id, amount: s.amount ?? 0, paid_by: paidBy }];
    });

    setDeudas(simplifyDebts(debtData));
    setLoading(false);
  }, [id, router, user]);

  useEffect(() => { load(); }, [load]);

  const handleConfirmPaid = async () => {
    if (!confirmDeuda) return;
    const { fromId, toId } = confirmDeuda;

    const supabase = createClient();
    const expensesOfTo = expensesByPayer[toId] ?? [];
    const expensesOfFrom = expensesByPayer[fromId] ?? [];

    if (expensesOfTo.length > 0) {
      await supabase
        .from("expense_splits")
        .update({ is_settled: true })
        .eq("user_id", fromId)
        .in("expense_id", expensesOfTo);
    }
    if (expensesOfFrom.length > 0) {
      await supabase
        .from("expense_splits")
        .update({ is_settled: true })
        .eq("user_id", toId)
        .in("expense_id", expensesOfFrom);
    }

    setDeudas((prev) =>
      prev.map((d) =>
        d.fromId === fromId && d.toId === toId ? { ...d, paid: true } : d
      )
    );
    setConfirmDeuda(null);
  };

  if (loading) return (
    <div className="max-w-lg mx-auto px-4 md:px-6 pt-8 flex flex-col gap-4 animate-pulse">
      <div className="h-6 w-40 rounded-xl bg-noche-media" />
      <div className="h-20 rounded-2xl bg-noche-media" />
      <div className="h-20 rounded-2xl bg-noche-media" />
    </div>
  );

  const pendientes = deudas.filter((d) => !d.paid);
  const pagadas = deudas.filter((d) => d.paid);
  const totalPendiente = pendientes.reduce((s, d) => s + d.amount, 0);
  const allClear = pendientes.length === 0 && deudas.length > 0 || deudas.length === 0;

  return (
    <div className="max-w-2xl mx-auto pb-8">
      <div className="px-4 md:px-6 pt-4 pb-2">
        <button
          onClick={() => router.push(`/groups/${id}`)}
          className="flex items-center gap-1 text-fuego text-[13px] font-semibold bg-transparent border-none cursor-pointer p-0 mb-3"
        >
          <ChevronLeft size={16} />
          {groupName}
        </button>
        <h1 className="font-display font-bold text-[22px] text-humo">
          Cuentas del grupo
        </h1>
        <p className="text-sm text-niebla mt-1">
          Así quedaron los números.
        </p>
      </div>

      <div className="px-4 md:px-6 flex flex-col gap-3 mt-2">
        {allClear ? (
          <div className="bg-noche-media rounded-2xl p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-menta/[0.12] flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">✓</span>
            </div>
            <p className="font-semibold text-base text-humo">Todo cerrado</p>
            <p className="text-sm text-niebla mt-1">No hay cuentas pendientes. Amistad preservada.</p>
          </div>
        ) : (
          <div className="bg-noche-media rounded-2xl p-4 text-center">
            <p className="text-[13px] text-niebla">Cuentas pendientes</p>
            <p className="font-display font-bold text-[28px] text-humo mt-1">
              ${fmtARS(totalPendiente)}
            </p>
            <p className="text-[13px] text-niebla mt-0.5">
              {pendientes.length} transferencia{pendientes.length > 1 ? "s" : ""} pendiente{pendientes.length > 1 ? "s" : ""}
            </p>
          </div>
        )}

        <PersonalSummary deudas={deudas} myId={myUserId} />

        {pendientes.length > 0 && (
          <>
            <p className="text-[11px] font-semibold text-niebla uppercase tracking-wider mt-2">
              Pendientes
            </p>
            {pendientes.map((d, i) => {
              const from = members.find((m) => m.id === d.fromId);
              const to = members.find((m) => m.id === d.toId);
              if (!from || !to) return null;
              return (
                <DeudaCard
                  key={`p-${i}`}
                  deuda={d}
                  from={from}
                  to={to}
                  onMarkPaid={() => setConfirmDeuda(d)}
                />
              );
            })}
          </>
        )}

        {pagadas.length > 0 && (
          <>
            <p className="text-[11px] font-semibold text-niebla uppercase tracking-wider mt-4">
              Cerradas
            </p>
            {pagadas.map((d, i) => {
              const from = members.find((m) => m.id === d.fromId);
              const to = members.find((m) => m.id === d.toId);
              if (!from || !to) return null;
              return <DeudaCard key={`c-${i}`} deuda={d} from={from} to={to} />;
            })}
          </>
        )}

        <p className="text-xs text-niebla text-center mt-2">
          Ronda simplificó las cuentas para que haya menos transferencias.
        </p>
      </div>

      {confirmDeuda && (() => {
        const from = members.find((m) => m.id === confirmDeuda.fromId);
        const to = members.find((m) => m.id === confirmDeuda.toId);
        if (!from || !to) return null;
        return (
          <ConfirmPagoModal
            open
            onClose={() => setConfirmDeuda(null)}
            onConfirm={handleConfirmPaid}
            from={from}
            to={to}
            amountLabel={`$${fmtARS(confirmDeuda.amount)}`}
          />
        );
      })()}
    </div>
  );
}

function PersonalSummary({ deudas, myId }: { deudas: UIDebt[]; myId: string }) {
  const myDebts = deudas.filter((d) => d.fromId === myId && !d.paid);
  const myCredits = deudas.filter((d) => d.toId === myId && !d.paid);
  const totalDebt = myDebts.reduce((s, d) => s + d.amount, 0);
  const totalCredit = myCredits.reduce((s, d) => s + d.amount, 0);

  if (totalDebt === 0 && totalCredit === 0) return null;

  return (
    <div className="bg-noche-media rounded-2xl p-4">
      <p className="text-[11px] font-semibold text-niebla uppercase tracking-wider mb-3">
        Tu resumen
      </p>
      <div className="flex gap-4">
        {totalDebt > 0 && (
          <div className="flex-1 bg-noche rounded-xl p-3 text-center">
            <p className="text-xs text-niebla mb-0.5">Debés</p>
            <p className="font-bold text-lg text-humo">${fmtARS(totalDebt)}</p>
          </div>
        )}
        {totalCredit > 0 && (
          <div className="flex-1 bg-noche rounded-xl p-3 text-center">
            <p className="text-xs text-niebla mb-0.5">Te deben</p>
            <p className="font-bold text-lg text-humo">${fmtARS(totalCredit)}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DeudaCard({
  deuda, from, to, onMarkPaid,
}: {
  deuda: UIDebt;
  from: UIMember;
  to: UIMember;
  onMarkPaid?: () => void;
}) {
  return (
    <div className={`bg-noche-media rounded-2xl p-4 ${deuda.paid ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-2 mb-3">
        <Avatar name={from.name} colorIndex={from.colorIndex} />
        <span className="text-lg text-niebla">→</span>
        <Avatar name={to.name} colorIndex={to.colorIndex} />
      </div>

      {deuda.paid ? (
        <div className="flex items-center gap-1.5">
          <span className="text-menta text-base">✓</span>
          <span className="text-sm font-semibold text-menta">Cuenta cerrada. Estás en paz.</span>
        </div>
      ) : (
        <>
          <p className="font-semibold text-[15px] text-humo">
            {from.name} le debe a {to.name}
          </p>
          <p className="font-bold text-[22px] text-humo mt-1 mb-3">
            ${fmtARS(deuda.amount)}
          </p>
          <Button primary={false} full onClick={onMarkPaid}>
            Marcar como pagado
          </Button>
        </>
      )}
    </div>
  );
}
