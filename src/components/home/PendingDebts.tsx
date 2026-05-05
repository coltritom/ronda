"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fmtARS } from "@/lib/utils";
import { createClient } from "@/lib/supabase/clients";
import { useAuth } from "@/lib/supabase/auth-context";

interface DebtItem {
  groupId: string;
  groupName: string;
  groupEmoji: string;
  eventId: string;
  payerName: string;
  amount: number;
}

export function PendingDebts() {
  const router = useRouter();
  const user = useAuth();
  const [debts, setDebts] = useState<DebtItem[]>([]);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const supabase = createClient();

      const { data: splits } = await supabase
        .from("expense_splits")
        .select("amount, expense_id")
        .eq("user_id", user.id)
        .eq("is_settled", false);

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

      const expenseMap: Record<string, { event_id: string; paid_by: string }> = {};
      for (const e of expenses) expenseMap[e.id] = { event_id: e.event_id, paid_by: e.paid_by };

      const eventIds = [
        ...new Set(debtSplits.map((s) => expenseMap[s.expense_id]?.event_id).filter(Boolean)),
      ];
      if (!eventIds.length) return;

      const payerIds = [
        ...new Set(debtSplits.map((s) => expenseMap[s.expense_id]?.paid_by).filter(Boolean)),
      ];

      const [eventsResult, profilesResult] = await Promise.all([
        supabase
          .from("events")
          .select("id, group_id, groups(name)")
          .in("id", eventIds),
        supabase
          .from("profiles")
          .select("id, name")
          .in("id", payerIds),
      ]);

      // Build a list of unique group IDs from the events, then fetch emoji
      const eventGroupIds = [
        ...new Set((eventsResult.data ?? []).map((e) => e.group_id).filter(Boolean)),
      ];
      const emojiMap: Record<string, string> = {};
      if (eventGroupIds.length > 0) {
        const { data: emojiRows } = await supabase
          .from("groups")
          .select("id, emoji")
          .in("id", eventGroupIds);
        for (const row of emojiRows ?? []) {
          if ((row as { id: string; emoji?: string }).emoji)
            emojiMap[row.id] = (row as { id: string; emoji: string }).emoji;
        }
      }

      const eventInfo: Record<string, { groupId: string; groupName: string; groupEmoji: string }> = {};
      for (const e of eventsResult.data ?? []) {
        const g = Array.isArray(e.groups) ? e.groups[0] : e.groups;
        const gTyped = g as { name: string } | null;
        const groupName = gTyped?.name ?? "Grupo";
        eventInfo[e.id] = {
          groupId: e.group_id,
          groupName,
          groupEmoji: emojiMap[e.group_id] ?? groupName.charAt(0).toUpperCase(),
        };
      }

      const payerNames: Record<string, string> = {};
      for (const p of profilesResult.data ?? []) {
        payerNames[p.id] = p.name ?? "Alguien";
      }

      // Aggregate by event
      const byEvent: Record<string, DebtItem> = {};
      for (const s of debtSplits) {
        const exp = expenseMap[s.expense_id];
        if (!exp) continue;
        const info = eventInfo[exp.event_id];
        if (!info) continue;
        const existing = byEvent[exp.event_id];
        byEvent[exp.event_id] = {
          groupId: info.groupId,
          groupName: info.groupName,
          groupEmoji: info.groupEmoji,
          eventId: exp.event_id,
          payerName: payerNames[exp.paid_by] ?? "Alguien",
          amount: (existing?.amount ?? 0) + (s.amount ?? 0),
        };
      }

      setDebts(Object.values(byEvent).filter((d) => d.amount > 0.005));
    }

    load();
  }, [user]);

  if (debts.length === 0) return null;

  const total = debts.reduce((s, d) => s + d.amount, 0);
  const groupCount = new Set(debts.map((d) => d.groupId)).size;

  return (
    <div className="px-4 md:px-6 mb-3">
      <div className="bg-noche-media dark:bg-noche-media bg-crema rounded-2xl p-3.5 border-l-[3px] border-alerta">
        <div className="flex items-start justify-between mb-1">
          <p className="font-semibold text-sm text-carbon dark:text-humo">
            {debts.length} cuenta{debts.length > 1 ? "s" : ""} pendiente{debts.length > 1 ? "s" : ""}
          </p>
          <button
            onClick={() => router.push("/groups")}
            className="text-[12px] font-semibold text-fuego bg-transparent border-none cursor-pointer shrink-0 ml-2"
          >
            Ver →
          </button>
        </div>
        <p className="text-xs text-gris-cal dark:text-niebla mb-2.5">
          en {groupCount} grupo{groupCount > 1 ? "s" : ""} · ${fmtARS(total)} en total
        </p>

        <div className="flex flex-col gap-1.5">
          {debts.map((d) => (
            <button
              key={`${d.groupId}-${d.eventId}`}
              onClick={() => router.push(`/groups/${d.groupId}`)}
              className="flex items-center justify-between px-2 py-1.5 rounded-[10px] bg-noche dark:bg-noche bg-hueso w-full border-none cursor-pointer text-left"
            >
              <span className="text-xs text-carbon dark:text-humo">
                {d.groupEmoji} {d.groupName} → {d.payerName}
              </span>
              <span className="text-[13px] font-semibold text-carbon dark:text-humo shrink-0 ml-2">
                ${fmtARS(d.amount)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
