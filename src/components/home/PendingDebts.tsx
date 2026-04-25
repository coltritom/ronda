"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fmtARS } from "@/lib/utils";
import { createClient } from "@/lib/supabase/clients";

interface DebtItem {
  groupId: string;
  groupName: string;
  eventId: string;
  eventName: string;
  amount: number;
}

export function PendingDebts() {
  const router = useRouter();
  const [debts, setDebts] = useState<DebtItem[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: splits } = await supabase
        .from("expense_splits")
        .select("amount, expense_id")
        .eq("user_id", user.id);

      if (!splits?.length) return;

      const expenseIds = splits.map((s) => s.expense_id).filter(Boolean);

      const { data: expenses } = await supabase
        .from("expenses")
        .select("id, event_id, paid_by")
        .in("id", expenseIds);

      if (!expenses?.length) return;

      // Excluir splits donde el usuario pagó (no son deuda real)
      const paidByMe = new Set(
        expenses.filter((e) => e.paid_by === user.id).map((e) => e.id)
      );
      const debtSplits = splits.filter((s) => !paidByMe.has(s.expense_id));
      if (!debtSplits.length) return;

      const expenseToEvent: Record<string, string> = {};
      for (const e of expenses) expenseToEvent[e.id] = e.event_id;

      const eventIds = [
        ...new Set(debtSplits.map((s) => expenseToEvent[s.expense_id]).filter(Boolean)),
      ];
      if (!eventIds.length) return;

      const { data: events } = await supabase
        .from("events")
        .select("id, name, group_id, groups(name)")
        .in("id", eventIds);

      if (!events?.length) return;

      const eventInfo: Record<string, { groupId: string; groupName: string; eventName: string }> = {};
      for (const e of events) {
        eventInfo[e.id] = {
          groupId: e.group_id,
          groupName: (e.groups as any)?.name ?? "Grupo",
          eventName: e.name,
        };
      }

      const { data: settlements } = await supabase
        .from("settlements")
        .select("amount, event_id")
        .eq("from_user", user.id)
        .in("event_id", eventIds);

      const settledByEvent: Record<string, number> = {};
      for (const s of settlements ?? []) {
        settledByEvent[s.event_id] = (settledByEvent[s.event_id] ?? 0) + (s.amount ?? 0);
      }

      const byEvent: Record<string, DebtItem & { amount: number }> = {};
      for (const s of debtSplits) {
        const eventId = expenseToEvent[s.expense_id];
        if (!eventId || !eventInfo[eventId]) continue;
        const { groupId, groupName, eventName } = eventInfo[eventId];
        byEvent[eventId] = {
          groupId,
          groupName,
          eventId,
          eventName,
          amount: (byEvent[eventId]?.amount ?? 0) + (s.amount ?? 0),
        };
      }

      const result: DebtItem[] = [];
      for (const [eventId, item] of Object.entries(byEvent)) {
        const net = item.amount - (settledByEvent[eventId] ?? 0);
        if (net > 0.005) result.push({ ...item, amount: net });
      }

      setDebts(result);
    }

    load();
  }, []);

  if (debts.length === 0) return null;

  const total = debts.reduce((s, d) => s + d.amount, 0);
  const groupCount = new Set(debts.map((d) => d.groupId)).size;

  return (
    <div className="px-4 md:px-6 mb-3">
      <div className="bg-noche-media dark:bg-noche-media bg-crema rounded-2xl p-3.5 border-l-[3px] border-alerta">
        <div className="mb-2.5">
          <p className="font-semibold text-sm text-carbon dark:text-humo">
            {debts.length} cuenta{debts.length > 1 ? "s" : ""} pendiente{debts.length > 1 ? "s" : ""}
          </p>
          <p className="text-xs text-gris-cal dark:text-niebla mt-0.5">
            en {groupCount} grupo{groupCount > 1 ? "s" : ""} · ${fmtARS(total)} en total
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          {debts.map((d) => (
            <button
              key={`${d.groupId}-${d.eventId}`}
              onClick={() => router.push(`/groups/${d.groupId}/events/${d.eventId}?tab=cuentas`)}
              className="flex items-center justify-between px-2 py-1.5 rounded-[10px] bg-noche dark:bg-noche bg-hueso w-full border-none cursor-pointer text-left"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-gris-cal dark:text-niebla">{d.groupName}</span>
                <span className="text-xs text-carbon dark:text-humo font-medium">{d.eventName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-semibold text-carbon dark:text-humo">
                  ${fmtARS(d.amount)}
                </span>
                <span className="text-muted text-xs">→</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
