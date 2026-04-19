"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { MOCK_GROUPS } from "@/lib/constants";
import { getDynamicGroups, type DynamicGroup } from "@/lib/store";
import { GroupCard } from "@/components/grupo/GroupCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { FAB } from "@/components/ui/FAB";
import { Button } from "@/components/ui/Button";
import { CreateGroupSheet } from "@/components/grupo/CreateGroupSheet";

export default function GruposPage() {
  const [dynamicGroups, setDynamicGroups] = useState<DynamicGroup[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    setDynamicGroups(getDynamicGroups());
  }, [sheetOpen]); // re-read store when sheet closes (after creation)

  const groups = [...dynamicGroups, ...MOCK_GROUPS];

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

      <CreateGroupSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}
