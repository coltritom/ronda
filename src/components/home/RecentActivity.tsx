"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/clients";

interface ActivityItem {
  id: string;
  name: string;
  groupName: string;
  date: string;
}

export function RecentActivity() {
  const [items, setItems] = useState<ActivityItem[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: memberships } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id);

      const groupIds = (memberships ?? []).map((m) => m.group_id);
      if (!groupIds.length) return;

      const { data: events } = await supabase
        .from("events")
        .select("id, name, date, group_id, groups ( name )")
        .in("group_id", groupIds)
        .order("date", { ascending: false })
        .limit(5);

      if (events) {
        setItems(
          events.map((e) => {
            const g = e.groups;
            const single = Array.isArray(g) ? g[0] : g;
            return {
              id: e.id,
              name: e.name,
              date: e.date,
              groupName: (single as { name: string } | null)?.name ?? "Grupo",
            };
          })
        );
      }
    }
    load();
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="px-4 md:px-6 mb-3">
      <p className="font-display font-semibold text-[15px] text-carbon dark:text-humo mb-2">
        Actividad reciente
      </p>

      <div className="bg-noche-media dark:bg-noche-media bg-crema rounded-2xl py-1">
        {items.map((item, i) => (
          <div
            key={item.id}
            className={`
              flex gap-2.5 px-3.5 py-2.5
              ${i > 0 ? "border-t border-white/[0.04] dark:border-white/[0.04] border-black/[0.04]" : ""}
            `}
          >
            <span className="text-base mt-0.5 shrink-0">📅</span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-carbon dark:text-humo m-0 leading-snug">{item.name}</p>
              <p className="text-[11px] text-gris-cal dark:text-niebla mt-0.5">{item.groupName}</p>
            </div>
            <span className="text-[10px] text-gris-cal/50 dark:text-niebla/50 whitespace-nowrap shrink-0 mt-0.5">
              {new Intl.DateTimeFormat("es-AR", {
                day: "numeric",
                month: "short",
                timeZone: "America/Argentina/Buenos_Aires",
              }).format(new Date(item.date))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
