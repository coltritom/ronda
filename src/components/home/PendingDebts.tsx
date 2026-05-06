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

      // Phase 1: expense_splits with nested expenses (2 tables, 1 round-trip)
      const { data: splitsRaw } = await supabase
        .from("expense_splits")
        .select("amount, expense_id, expenses(id, event_id, paid_by)")
        .eq("user_id", user.id)
        .eq("is_settled", false);

      if (!splitsRaw?.length) return;

      const debtSplits = splitsRaw.flatMap((s) => {
        const exp = Array.isArray(s.expenses) ? s.expenses[0] : s.expenses;
        if (!exp?.event_id || !exp?.paid_by || exp.paid_by === user.id) return [];
        return [{ amount: s.amount ?? 0, event_id: exp.event_id as string, paid_by: exp.paid_by as string }];
      });

      if (!debtSplits.length) return;

      const eventIds = [...new Set(debtSplits.map((s) => s.event_id))];
      const payerIds = [...new Set(debtSplits.map((s) => s.paid_by))];

      // Phase 2: events+groups and profiles in parallel
      const [eventsResult, profilesResult] = await Promise.all([
        supabase.from("events").select("id, group_id, groups(name, emoji)").in("id", eventIds),
        supabase.from("profiles").select("id, name").in("id", payerIds),
      ]);

      const eventInfo: Record<string, { groupId: string; groupName: string; groupEmoji: string }> = {};
      for (const e of eventsResult.data ?? []) {
        const g = Array.isArray(e.groups) ? e.groups[0] : e.groups;
        const gTyped = g as { name: string; emoji: string | null } | null;
        const groupName = gTyped?.name ?? "Grupo";
        eventInfo[e.id] = {
          groupId: e.group_id,
          groupName,
          groupEmoji: gTyped?.emoji ?? groupName.charAt(0).toUpperCase(),
        };
      }

      const payerNames: Record<string, string> = {};
      for (const p of profilesResult.data ?? []) {
        payerNames[p.id] = p.name ?? "Alguien";
      }

      const byEvent: Record<string, DebtItem> = {};
      for (const s of debtSplits) {
        const info = eventInfo[s.event_id];
        if (!info) continue;
        const existing = byEvent[s.event_id];
        byEvent[s.event_id] = {
          groupId: info.groupId,
          groupName: info.groupName,
          groupEmoji: info.groupEmoji,
          eventId: s.event_id,
          payerName: payerNames[s.paid_by] ?? "Alguien",
          amount: (existing?.amount ?? 0) + s.amount,
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
