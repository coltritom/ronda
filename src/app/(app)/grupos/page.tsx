"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/clients";
import { GroupCard } from "@/components/grupo/GroupCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { FAB } from "@/components/ui/FAB";
import { Button } from "@/components/ui/Button";
import { CreateGroupSheet } from "@/components/grupo/CreateGroupSheet";

interface GroupItem {
  id: string;
  name: string;
  emoji: string;
  memberCount: number;
  lastActivity: string;
  pendingCount: number;
  pendingAmount: number;
}

export default function GruposPage() {
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  const loadGroups = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Grupos del usuario
    const { data: memberships } = await supabase
      .from("group_members")
      .select("groups ( id, name )")
      .eq("user_id", user.id);

    const userGroups = (memberships ?? [])
      .map((m) => {
        const g = Array.isArray(m.groups) ? m.groups[0] : m.groups;
        return g as { id: string; name: string } | null;
      })
      .filter((g): g is { id: string; name: string } => g !== null);

    if (!userGroups.length) {
      setGroups([]);
      return;
    }

    const groupIds = userGroups.map((g) => g.id);

    // 2. Cantidad de integrantes por grupo
    const { data: allMembers } = await supabase
      .from("group_members")
      .select("group_id")
      .in("group_id", groupIds);

    const memberCountByGroup: Record<string, number> = {};
    for (const m of allMembers ?? []) {
      memberCountByGroup[m.group_id] = (memberCountByGroup[m.group_id] ?? 0) + 1;
    }

    // 3. Última juntada + ids de eventos para cada grupo
    const { data: allEvents } = await supabase
      .from("events")
      .select("id, group_id, date")
      .in("group_id", groupIds)
      .neq("status", "cancelled")
      .order("date", { ascending: false });

    const lastActivityByGroup: Record<string, string> = {};
    const eventToGroup: Record<string, string> = {};
    const allEventIds: string[] = [];

    for (const e of allEvents ?? []) {
      if (!lastActivityByGroup[e.group_id]) {
        lastActivityByGroup[e.group_id] = new Intl.DateTimeFormat("es-AR", {
          day: "numeric",
          month: "short",
          timeZone: "America/Argentina/Buenos_Aires",
        }).format(new Date(e.date));
      }
      eventToGroup[e.id] = e.group_id;
      allEventIds.push(e.id);
    }

    // 4. Gastos pendientes del usuario por grupo
    const pendingByGroup: Record<string, { count: number; amount: number }> = {};

    if (allEventIds.length > 0) {
      const { data: expenseRows } = await supabase
        .from("expenses")
        .select("id, event_id")
        .in("event_id", allEventIds);

      const expenseToEvent: Record<string, string> = {};
      const allExpenseIds: string[] = [];
      for (const e of expenseRows ?? []) {
        expenseToEvent[e.id] = e.event_id;
        allExpenseIds.push(e.id);
      }

      if (allExpenseIds.length > 0) {
        const { data: pendingSplits } = await supabase
          .from("expense_splits")
          .select("expense_id, amount")
          .eq("user_id", user.id)
          .eq("is_settled", false)
          .in("expense_id", allExpenseIds);

        for (const split of pendingSplits ?? []) {
          const eventId = expenseToEvent[split.expense_id];
          const groupId = eventToGroup[eventId];
          if (!groupId) continue;
          if (!pendingByGroup[groupId]) pendingByGroup[groupId] = { count: 0, amount: 0 };
          pendingByGroup[groupId].count++;
          pendingByGroup[groupId].amount += split.amount ?? 0;
        }
      }
    }

    setGroups(
      userGroups.map((g) => ({
        id: g.id,
        name: g.name,
        emoji: g.name.charAt(0).toUpperCase(),
        memberCount: memberCountByGroup[g.id] ?? 0,
        lastActivity: lastActivityByGroup[g.id] ?? "Sin juntadas",
        pendingCount: pendingByGroup[g.id]?.count ?? 0,
        pendingAmount: pendingByGroup[g.id]?.amount ?? 0,
      }))
    );
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const handleSheetClose = () => {
    setSheetOpen(false);
    loadGroups();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="px-4 md:px-6 pt-5 pb-3 flex items-center justify-between">
        <h1 className="font-display font-bold text-2xl text-humo">Tus grupos</h1>
        {groups.length > 0 && (
          <div className="hidden md:block">
            <Button onClick={() => setSheetOpen(true)}>
              <Plus size={16} />
              Crear grupo
            </Button>
          </div>
        )}
      </div>

      {groups.length === 0 ? (
        <EmptyState
          title="Todavía no tenés grupos."
          description="Creá uno nuevo o unite a uno existente con un link de invitación."
          actionLabel="Crear grupo"
          onAction={() => setSheetOpen(true)}
          secondaryLabel="Tengo un link de invitación"
        />
      ) : (
        <div className="px-4 md:px-6 flex flex-col gap-3 pb-6">
          {groups.map((g) => (
            <GroupCard
              key={g.id}
              id={g.id}
              name={g.name}
              emoji={g.emoji}
              memberCount={g.memberCount}
              lastActivity={g.lastActivity}
              pendingCount={g.pendingCount}
              pendingAmount={g.pendingAmount}
            />
          ))}
        </div>
      )}

      {groups.length > 0 && <FAB label="Crear grupo" onClick={() => setSheetOpen(true)} />}

      <CreateGroupSheet open={sheetOpen} onClose={handleSheetClose} />
    </div>
  );
}
