"use client";

import { useState, useEffect } from "react";
import { Pill } from "@/components/ui/Pill";
import { createClient } from "@/lib/supabase/clients";

const TAG_DEFS = {
  veterano:    { label: "El Veterano",        emoji: "🏆", color: "ambar" },
  nuevo:       { label: "El Nuevo",           emoji: "🌱", color: "menta" },
  organizador: { label: "El Organizador",     emoji: "📋", color: "uva"   },
  provisto:    { label: "El Provisto",        emoji: "🎒", color: "menta" },
  mecenas:     { label: "El Mecenas",         emoji: "💸", color: "ambar" },
  fijo:        { label: "El Fijo",            emoji: "📅", color: "menta" },
  fantasma:    { label: "El Fantasma",        emoji: "👻", color: "uva"   },
  indeciso:    { label: "El Indeciso",        emoji: "🤷", color: "fuego" },
  caradura:    { label: "El Cara Dura",       emoji: "😏", color: "rosa"  },
  ausente:     { label: "El Ausente Digital", emoji: "📵", color: "uva"   },
  mvp:         { label: "El MVP",             emoji: "⭐", color: "ambar" },
} as const;

type TagKey = keyof typeof TAG_DEFS;

interface MemberInput {
  userId: string;
  attendance: number;
  maybeCount: number;
  eventsCreated: number;
  contributions: number;
  expensesPaid: number;
}

interface GroupStats {
  totalEvents: number;
  oldestJoin: string;
  newestJoin: string;
  maxEventsCreated: number;
  maxContributions: number;
  maxExpensesPaid: number;
  memberCount: number;
}

function assignTags(member: MemberInput, group: GroupStats): TagKey[] {
  const tags: TagKey[] = [];
  const { totalEvents } = group;

  // veterano/nuevo require created_at on group_members — skipped until column exists
  if (member.eventsCreated > 0 && member.eventsCreated === group.maxEventsCreated)
    tags.push("organizador");
  if (member.contributions > 0 && member.contributions === group.maxContributions)
    tags.push("provisto");
  if (member.expensesPaid > 0 && member.expensesPaid === group.maxExpensesPaid)
    tags.push("mecenas");
  if (totalEvents >= 3 && member.attendance / totalEvents >= 0.8) tags.push("fijo");
  if (totalEvents >= 3 && member.attendance / totalEvents <= 0.2) tags.push("fantasma");
  if (totalEvents >= 2 && member.attendance === 0 && member.maybeCount === 0)
    tags.push("ausente");
  if (member.maybeCount >= 3) tags.push("indeciso");
  if (member.attendance >= 2 && member.expensesPaid === 0 && member.contributions === 0)
    tags.push("caradura");

  return tags;
}

interface Badge {
  tagKey: TagKey;
  groupName: string;
}

export function MyBadges() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoaded(true); return; }

      const { data: myMemberships } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id);

      if (!myMemberships?.length) { setLoaded(true); return; }

      const groupIds = myMemberships.map(m => m.group_id);

      const [membersRes, eventsRes, groupsRes] = await Promise.all([
        supabase.from("group_members").select("user_id, group_id").in("group_id", groupIds),
        supabase.from("events").select("id, group_id, created_by").in("group_id", groupIds),
        supabase.from("groups").select("id, name").in("id", groupIds),
      ]);

      const groupNameMap = Object.fromEntries((groupsRes.data ?? []).map(g => [g.id, g.name]));

      const allEvents = eventsRes.data ?? [];
      const eventIds = allEvents.map(e => e.id);

      let attendanceData: { user_id: string; event_id: string }[] = [];
      let rsvpData: { user_id: string; response: string; event_id: string }[] = [];
      let contribData: { user_id: string; event_id: string }[] = [];
      let expensesData: { paid_by: string; amount: number; event_id: string }[] = [];

      if (eventIds.length > 0) {
        const [attRes, rsvpRes, cRes, expRes] = await Promise.all([
          supabase.from("event_attendance").select("user_id, event_id").in("event_id", eventIds),
          supabase.from("event_rsvps").select("user_id, response, event_id").in("event_id", eventIds),
          supabase.from("contributions").select("user_id, event_id").in("event_id", eventIds),
          supabase.from("expenses").select("paid_by, amount, event_id").in("event_id", eventIds),
        ]);
        attendanceData = attRes.data ?? [];
        rsvpData       = rsvpRes.data ?? [];
        contribData    = cRes.data ?? [];
        expensesData   = expRes.data ?? [];
      }

      const allBadges: Badge[] = [];

      for (const membership of myMemberships) {
        const { group_id } = membership;
        const groupName = groupNameMap[group_id] ?? "";

        const groupMembers = (membersRes.data ?? []).filter(m => m.group_id === group_id);
        const groupEvents  = allEvents.filter(e => e.group_id === group_id);
        if (groupEvents.length === 0) continue;

        const groupEventIds = new Set(groupEvents.map(e => e.id));

        type Stats = {
          attendance: number; maybeCount: number; eventsCreated: number;
          contributions: number; expensesPaid: number;
        };
        const statsMap: Record<string, Stats> = {};
        for (const gm of groupMembers) {
          statsMap[gm.user_id] = {
            attendance: 0, maybeCount: 0, eventsCreated: 0,
            contributions: 0, expensesPaid: 0,
          };
        }

        for (const e of groupEvents)
          if (statsMap[e.created_by]) statsMap[e.created_by].eventsCreated++;
        for (const a of attendanceData)
          if (groupEventIds.has(a.event_id) && statsMap[a.user_id]) statsMap[a.user_id].attendance++;
        for (const r of rsvpData)
          if (groupEventIds.has(r.event_id) && r.response === "maybe" && statsMap[r.user_id])
            statsMap[r.user_id].maybeCount++;
        for (const c of contribData)
          if (groupEventIds.has(c.event_id) && statsMap[c.user_id]) statsMap[c.user_id].contributions++;
        for (const e of expensesData)
          if (groupEventIds.has(e.event_id) && statsMap[e.paid_by])
            statsMap[e.paid_by].expensesPaid += Number(e.amount);

        const allStats = Object.values(statsMap);

        const groupStats: GroupStats = {
          totalEvents:      groupEvents.length,
          oldestJoin:       "",
          newestJoin:       "",
          maxEventsCreated: Math.max(0, ...allStats.map(s => s.eventsCreated)),
          maxContributions: Math.max(0, ...allStats.map(s => s.contributions)),
          maxExpensesPaid:  Math.max(0, ...allStats.map(s => s.expensesPaid)),
          memberCount:      groupMembers.length,
        };

        const myStats = statsMap[user.id];
        if (!myStats) continue;

        const tagKeys = assignTags({ userId: user.id, ...myStats }, groupStats);

        // MVP: normalized composite score
        const maxAtt = Math.max(1, ...allStats.map(s => s.attendance));
        const myScore =
          (myStats.attendance / maxAtt) * 0.4 +
          (groupStats.maxContributions > 0 ? myStats.contributions / groupStats.maxContributions : 0) * 0.3 +
          (groupStats.maxExpensesPaid > 0 ? myStats.expensesPaid / groupStats.maxExpensesPaid : 0) * 0.3;
        const topScore = Math.max(...allStats.map(s =>
          (s.attendance / maxAtt) * 0.4 +
          (groupStats.maxContributions > 0 ? s.contributions / groupStats.maxContributions : 0) * 0.3 +
          (groupStats.maxExpensesPaid > 0 ? s.expensesPaid / groupStats.maxExpensesPaid : 0) * 0.3
        ));
        if (myScore > 0 && myScore === topScore && !tagKeys.includes("mvp"))
          tagKeys.unshift("mvp");

        for (const key of tagKeys) {
          allBadges.push({ tagKey: key, groupName });
        }
      }

      setBadges(allBadges);
      setLoaded(true);
    }
    load();
  }, []);

  if (!loaded || badges.length === 0) return null;

  return (
    <div className="px-4 md:px-6 mb-3">
      <p className="font-display font-semibold text-[15px] text-carbon dark:text-humo mb-2">
        Tus etiquetas
      </p>
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 md:-mx-6 md:px-6">
        {badges.map((b, i) => {
          const def = TAG_DEFS[b.tagKey];
          return (
            <Pill key={i} color={def.color}>
              {def.emoji} {def.label} — {b.groupName}
            </Pill>
          );
        })}
      </div>
    </div>
  );
}
