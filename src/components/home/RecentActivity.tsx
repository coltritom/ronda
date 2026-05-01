"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/clients";

type ActivityType = "event_created" | "member_joined";

interface ActivityItem {
  id: string;
  type: ActivityType;
  actorName: string;
  groupName: string;
  eventName?: string;
  eventDate?: string;
  createdAt: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  if (hours < 24) return `hace ${hours}h`;
  if (days < 7) return `hace ${days}d`;
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(iso));
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

      const [eventsResult, joinsResult] = await Promise.all([
        supabase
          .from("events")
          .select("id, name, date, group_id, created_by, created_at, groups(name)")
          .in("group_id", groupIds)
          .neq("status", "cancelled")
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("group_members")
          .select("user_id, created_at, group_id, groups(name)")
          .in("group_id", groupIds)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      // Collect actor IDs for a single batch profiles fetch
      const actorIds = new Set<string>();
      for (const e of eventsResult.data ?? []) {
        if (e.created_by) actorIds.add(e.created_by);
      }
      for (const j of joinsResult.data ?? []) {
        if (j.user_id) actorIds.add(j.user_id);
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", [...actorIds]);

      const nameById: Record<string, string> = {};
      for (const p of profiles ?? []) nameById[p.id] = p.name ?? "Alguien";

      const activities: ActivityItem[] = [];

      for (const e of eventsResult.data ?? []) {
        if (!e.created_by || !e.created_at) continue;
        const g = Array.isArray(e.groups) ? e.groups[0] : e.groups;
        const groupName = (g as { name: string } | null)?.name ?? "Grupo";
        const formattedDate = new Intl.DateTimeFormat("es-AR", {
          weekday: "short",
          day: "numeric",
          month: "short",
          timeZone: "America/Argentina/Buenos_Aires",
        }).format(new Date(e.date));

        activities.push({
          id: `event-${e.id}`,
          type: "event_created",
          actorName: nameById[e.created_by] ?? "Alguien",
          groupName,
          eventName: e.name,
          eventDate: formattedDate,
          createdAt: e.created_at,
        });
      }

      for (const j of joinsResult.data ?? []) {
        if (!j.user_id || !j.created_at) continue;
        const g = Array.isArray(j.groups) ? j.groups[0] : j.groups;
        const groupName = (g as { name: string } | null)?.name ?? "Grupo";
        activities.push({
          id: `join-${j.user_id}-${j.group_id}`,
          type: "member_joined",
          actorName: nameById[j.user_id] ?? "Alguien",
          groupName,
          createdAt: j.created_at,
        });
      }

      activities.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setItems(activities.slice(0, 8));
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
        {items.map((item, i) => {
          const title =
            item.type === "event_created"
              ? `${item.actorName} creó una juntada en ${item.groupName}`
              : `${item.actorName} se unió a ${item.groupName}`;
          const subtitle =
            item.type === "event_created" && item.eventName
              ? `${item.eventName} — ${item.eventDate}`
              : undefined;

          return (
            <div
              key={item.id}
              className={`
                flex gap-2.5 px-3.5 py-2.5
                ${i > 0 ? "border-t border-white/[0.04] dark:border-white/[0.04] border-black/[0.04]" : ""}
              `}
            >
              <span className="text-base mt-0.5 shrink-0">
                {item.type === "event_created" ? "📅" : "👋"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-carbon dark:text-humo m-0 leading-snug">{title}</p>
                {subtitle && (
                  <p className="text-[11px] text-gris-cal dark:text-niebla mt-0.5">{subtitle}</p>
                )}
              </div>
              <span className="text-[10px] text-gris-cal/50 dark:text-niebla/50 whitespace-nowrap shrink-0 mt-0.5">
                {timeAgo(item.createdAt)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
