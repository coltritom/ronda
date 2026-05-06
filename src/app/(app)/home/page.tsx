import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PersonalSummary } from "@/components/home/PersonalSummary";
import { PendingDebts } from "@/components/home/PendingDebts";
import { UpcomingJuntadas } from "@/components/home/UpcomingJuntadas";
import { RecentActivity } from "@/components/home/RecentActivity";
import { MyGroups } from "@/components/home/MyGroups";
import { MyBadges } from "@/components/home/MyBadges";
import {
  assignTags, TAG_DEFS,
  type Badge, type MemberInput, type GroupStats,
} from "@/components/home/MyBadges";
import type { DebtItem } from "@/components/home/PendingDebts";
import type { ActivityItem } from "@/components/home/RecentActivity";
import type { UpcomingEvent, RSVPStatus } from "@/components/home/UpcomingJuntadas";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const NOW = new Date().toISOString();

  // ── Round 1: all queries needing only user.id ─────────────────────────────
  const [
    { data: profileRaw },
    { data: membershipsRaw },
    { data: allSplitsRaw },
    { data: unsettledSplitsRaw },
    { data: settledOutRaw },
    { data: settledInRaw },
  ] = await Promise.all([
    supabase.from("profiles").select("name").eq("id", user.id).single(),
    supabase.from("group_members").select("group_id, groups(id, name, emoji)").eq("user_id", user.id),
    supabase.from("expense_splits").select("expense_id, amount").eq("user_id", user.id),
    supabase.from("expense_splits").select("amount, expense_id, expenses(id, event_id, paid_by)").eq("user_id", user.id).eq("is_settled", false),
    supabase.from("settlements").select("amount").eq("from_user", user.id),
    supabase.from("settlements").select("amount").eq("to_user", user.id),
  ]);

  // Repair profile name if trigger mis-wired it as email
  const profileName = profileRaw?.name ?? "";
  const isEmailInName = profileName.includes("@");
  const metaName: string =
    user.user_metadata?.display_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name || "";
  const resolvedName = isEmailInName ? metaName : profileName;
  if (isEmailInName && metaName) {
    supabase.from("profiles").update({ name: metaName }).eq("id", user.id);
  }

  const groupIds = (membershipsRaw ?? []).map((m) => m.group_id);
  const myExpenseIds = (allSplitsRaw ?? []).map((s) => s.expense_id).filter(Boolean) as string[];

  // Process unsettled splits for PendingDebts — need eventIds/payerIds for Round 2
  const debtSplits = (unsettledSplitsRaw ?? []).flatMap((s) => {
    const exp = Array.isArray(s.expenses) ? s.expenses[0] : s.expenses;
    const e = exp as { id: string; event_id: string; paid_by: string } | null;
    if (!e?.event_id || !e?.paid_by || e.paid_by === user.id) return [];
    return [{ amount: s.amount ?? 0, event_id: e.event_id, paid_by: e.paid_by }];
  });
  const debtEventIds = [...new Set(debtSplits.map((s) => s.event_id))];
  const debtPayerIds = [...new Set(debtSplits.map((s) => s.paid_by))];

  if (!groupIds.length) {
    return (
      <div className="max-w-2xl mx-auto pb-8">
        <PersonalSummary name={resolvedName || "Vos"} debes={0} teDebon={0} attended={0} totalEvents={0} />
        <UpcomingJuntadas initialEvents={[]} userId={user.id} />
        <MyGroups initialGroups={[]} />
      </div>
    );
  }

  // ── Round 2: parallel queries depending on Round 1 ────────────────────────
  const [
    { data: expensesRaw },
    { data: lastTenRaw },
    { data: debtEventsRaw },
    { data: debtPayersRaw },
    { data: upcomingRaw },
    { data: memberCountsRaw },
    { data: recentEventsRaw },
    { data: recentJoinsRaw },
    { data: badgeEventsRaw },
  ] = await Promise.all([
    myExpenseIds.length > 0
      ? supabase.from("expenses").select("id, paid_by").in("id", myExpenseIds)
      : Promise.resolve({ data: [] as { id: string; paid_by: string }[] }),
    supabase.from("events").select("id").in("group_id", groupIds).neq("status", "cancelled").lte("date", NOW).order("date", { ascending: false }).limit(10),
    debtEventIds.length > 0
      ? supabase.from("events").select("id, group_id, groups(name, emoji)").in("id", debtEventIds)
      : Promise.resolve({ data: [] as { id: string; group_id: string; groups: unknown }[] }),
    debtPayerIds.length > 0
      ? supabase.from("profiles").select("id, name").in("id", debtPayerIds)
      : Promise.resolve({ data: [] as { id: string; name: string | null }[] }),
    supabase.from("events").select("id, name, date, group_id, groups(name, emoji), event_rsvps(user_id, response)").in("group_id", groupIds).neq("status", "cancelled").gte("date", NOW).order("date", { ascending: true }).limit(5),
    supabase.from("group_members").select("group_id").in("group_id", groupIds),
    supabase.from("events").select("id, name, date, group_id, created_by, created_at, groups(name)").in("group_id", groupIds).neq("status", "cancelled").order("created_at", { ascending: false }).limit(10),
    supabase.from("group_members").select("user_id, joined_at, group_id, groups(name)").in("group_id", groupIds).order("joined_at", { ascending: false }).limit(10),
    supabase.from("events").select("id, group_id, created_by").in("group_id", groupIds),
  ]);

  // Derive Round 3 inputs
  const paidByMeIds = new Set((expensesRaw ?? []).filter((e) => e.paid_by === user.id).map((e) => e.id));
  const paidByOtherIds = new Set((expensesRaw ?? []).filter((e) => e.paid_by !== user.id).map((e) => e.id));
  const paidByMeArray = [...paidByMeIds];
  const lastTenIds = (lastTenRaw ?? []).map((e) => e.id);
  const badgeEventIds = (badgeEventsRaw ?? []).map((e) => e.id);

  const actorIds = new Set<string>();
  for (const e of recentEventsRaw ?? []) if (e.created_by) actorIds.add(e.created_by);
  for (const j of recentJoinsRaw ?? []) if (j.user_id) actorIds.add(j.user_id);

  // ── Round 3: parallel queries depending on Round 2 ────────────────────────
  const [
    { data: othersSplitsData },
    { data: attendanceData },
    { data: actorProfilesRaw },
    { data: badgeAttendanceRaw },
    { data: badgeRsvpRaw },
    { data: badgeContribRaw },
    { data: badgeExpensesRaw },
    { data: badgeMembersRaw },
  ] = await Promise.all([
    paidByMeArray.length > 0
      ? supabase.from("expense_splits").select("amount").in("expense_id", paidByMeArray).neq("user_id", user.id)
      : Promise.resolve({ data: [] as { amount: number }[] }),
    lastTenIds.length > 0
      ? supabase.from("event_attendance").select("event_id").eq("user_id", user.id).in("event_id", lastTenIds)
      : Promise.resolve({ data: [] as { event_id: string }[] }),
    actorIds.size > 0
      ? supabase.from("profiles").select("id, name").in("id", [...actorIds])
      : Promise.resolve({ data: [] as { id: string; name: string | null }[] }),
    badgeEventIds.length > 0
      ? supabase.from("event_attendance").select("user_id, event_id").in("event_id", badgeEventIds)
      : Promise.resolve({ data: [] as { user_id: string; event_id: string }[] }),
    badgeEventIds.length > 0
      ? supabase.from("event_rsvps").select("user_id, response, event_id").in("event_id", badgeEventIds)
      : Promise.resolve({ data: [] as { user_id: string; response: string; event_id: string }[] }),
    badgeEventIds.length > 0
      ? supabase.from("contributions").select("user_id, event_id").in("event_id", badgeEventIds)
      : Promise.resolve({ data: [] as { user_id: string; event_id: string }[] }),
    badgeEventIds.length > 0
      ? supabase.from("expenses").select("paid_by, amount, event_id").in("event_id", badgeEventIds)
      : Promise.resolve({ data: [] as { paid_by: string; amount: number; event_id: string }[] }),
    supabase.from("group_members").select("user_id, group_id").in("group_id", groupIds),
  ]);

  // ── PersonalSummary props ─────────────────────────────────────────────────
  const grossDebes = (allSplitsRaw ?? [])
    .filter((s) => paidByOtherIds.has(s.expense_id))
    .reduce((sum, s) => sum + (s.amount ?? 0), 0);
  const grossTeDebon = (othersSplitsData ?? []).reduce((s, r) => s + r.amount, 0);
  const totalSettledOut = (settledOutRaw ?? []).reduce((s, r) => s + r.amount, 0);
  const totalSettledIn  = (settledInRaw  ?? []).reduce((s, r) => s + r.amount, 0);
  const debes    = Math.max(0, grossDebes - totalSettledOut);
  const teDebon  = Math.max(0, grossTeDebon - totalSettledIn);
  const attended = (attendanceData ?? []).length;
  const totalEvents = lastTenIds.length;

  // ── PendingDebts props ────────────────────────────────────────────────────
  const debtEventInfo: Record<string, { groupId: string; groupName: string; groupEmoji: string }> = {};
  for (const e of debtEventsRaw ?? []) {
    const g = Array.isArray(e.groups) ? e.groups[0] : e.groups;
    const gTyped = g as { name: string; emoji: string | null } | null;
    const groupName = gTyped?.name ?? "Grupo";
    debtEventInfo[e.id] = { groupId: e.group_id, groupName, groupEmoji: gTyped?.emoji ?? groupName.charAt(0).toUpperCase() };
  }
  const payerNameMap: Record<string, string> = {};
  for (const p of debtPayersRaw ?? []) payerNameMap[p.id] = p.name ?? "Alguien";
  const debtsByEvent: Record<string, DebtItem> = {};
  for (const s of debtSplits) {
    const info = debtEventInfo[s.event_id];
    if (!info) continue;
    const prev = debtsByEvent[s.event_id];
    debtsByEvent[s.event_id] = {
      groupId: info.groupId, groupName: info.groupName, groupEmoji: info.groupEmoji,
      eventId: s.event_id, payerName: payerNameMap[s.paid_by] ?? "Alguien",
      amount: (prev?.amount ?? 0) + s.amount,
    };
  }
  const pendingDebts = Object.values(debtsByEvent).filter((d) => d.amount > 0.005);

  // ── UpcomingJuntadas props ────────────────────────────────────────────────
  const memberCountByGroup: Record<string, number> = {};
  for (const m of memberCountsRaw ?? []) {
    memberCountByGroup[m.group_id] = (memberCountByGroup[m.group_id] ?? 0) + 1;
  }
  const upcomingEvents: UpcomingEvent[] = (upcomingRaw ?? []).map((e) => {
    const g = Array.isArray(e.groups) ? e.groups[0] : e.groups;
    const gTyped = g as { name: string; emoji: string | null } | null;
    const groupName = gTyped?.name ?? "Grupo";
    const rsvps = (e.event_rsvps as { user_id: string; response: string }[]) ?? [];
    const going    = rsvps.filter((r) => r.response === "going").length;
    const maybe    = rsvps.filter((r) => r.response === "maybe").length;
    const declined = rsvps.filter((r) => r.response === "not_going").length;
    const noResponse = Math.max(0, (memberCountByGroup[e.group_id] ?? 0) - going - maybe - declined);
    const myRsvp = ((rsvps.find((r) => r.user_id === user.id)?.response) ?? "none") as RSVPStatus;
    const date = new Intl.DateTimeFormat("es-AR", {
      weekday: "short", day: "numeric", month: "short",
      timeZone: "America/Argentina/Buenos_Aires",
    }).format(new Date(e.date));
    return { id: e.id, name: e.name, date, groupId: e.group_id, groupName, groupEmoji: gTyped?.emoji ?? groupName.charAt(0).toUpperCase(), confirmed: going, noResponse, myRsvp };
  });

  // ── RecentActivity props ──────────────────────────────────────────────────
  const actorNameById: Record<string, string> = {};
  for (const p of actorProfilesRaw ?? []) actorNameById[p.id] = p.name ?? "Alguien";
  const activities: ActivityItem[] = [];
  for (const e of recentEventsRaw ?? []) {
    if (!e.created_by || !e.created_at) continue;
    const g = Array.isArray(e.groups) ? e.groups[0] : e.groups;
    const groupName = (g as { name: string } | null)?.name ?? "Grupo";
    const eventDate = new Intl.DateTimeFormat("es-AR", {
      weekday: "short", day: "numeric", month: "short",
      timeZone: "America/Argentina/Buenos_Aires",
    }).format(new Date(e.date));
    activities.push({ id: `event-${e.id}`, type: "event_created", actorName: actorNameById[e.created_by] ?? "Alguien", groupName, eventName: e.name, eventDate, createdAt: e.created_at });
  }
  for (const j of recentJoinsRaw ?? []) {
    if (!j.user_id || !j.joined_at) continue;
    const g = Array.isArray(j.groups) ? j.groups[0] : j.groups;
    const groupName = (g as { name: string } | null)?.name ?? "Grupo";
    activities.push({ id: `join-${j.user_id}-${j.group_id}`, type: "member_joined", actorName: actorNameById[j.user_id] ?? "Alguien", groupName, createdAt: j.joined_at });
  }
  activities.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const recentActivity = activities.slice(0, 8);

  // ── MyGroups props ────────────────────────────────────────────────────────
  const myGroups = (membershipsRaw ?? []).flatMap((m) => {
    const g = Array.isArray(m.groups) ? m.groups[0] : m.groups;
    const s = g as { id: string; name: string; emoji: string | null } | null;
    if (!s) return [];
    return [{ id: s.id, name: s.name, emoji: s.emoji ?? s.name.charAt(0).toUpperCase() }];
  });

  // ── MyBadges props ────────────────────────────────────────────────────────
  const badgeGroupNameMap = Object.fromEntries(
    (membershipsRaw ?? []).flatMap((m) => {
      const g = Array.isArray(m.groups) ? m.groups[0] : m.groups;
      const s = g as { id: string; name: string } | null;
      return s ? [[s.id, s.name]] : [];
    })
  );
  const allBadges: Badge[] = [];
  for (const gid of groupIds) {
    const groupName = badgeGroupNameMap[gid] ?? "";
    const groupEvents = (badgeEventsRaw ?? []).filter((e) => e.group_id === gid);
    if (groupEvents.length === 0) continue;
    const groupEventIds = new Set(groupEvents.map((e) => e.id));
    const groupMembers = (badgeMembersRaw ?? []).filter((m) => m.group_id === gid);

    type Stats = { attendance: number; maybeCount: number; eventsCreated: number; contributions: number; expensesPaid: number };
    const statsMap: Record<string, Stats> = {};
    for (const gm of groupMembers) {
      statsMap[gm.user_id] = { attendance: 0, maybeCount: 0, eventsCreated: 0, contributions: 0, expensesPaid: 0 };
    }
    for (const e of groupEvents) if (statsMap[e.created_by]) statsMap[e.created_by].eventsCreated++;
    for (const a of badgeAttendanceRaw ?? []) if (groupEventIds.has(a.event_id) && statsMap[a.user_id]) statsMap[a.user_id].attendance++;
    for (const r of badgeRsvpRaw ?? []) if (groupEventIds.has(r.event_id) && r.response === "maybe" && statsMap[r.user_id]) statsMap[r.user_id].maybeCount++;
    for (const c of badgeContribRaw ?? []) if (groupEventIds.has(c.event_id) && statsMap[c.user_id]) statsMap[c.user_id].contributions++;
    for (const e of badgeExpensesRaw ?? []) if (groupEventIds.has(e.event_id) && statsMap[e.paid_by]) statsMap[e.paid_by].expensesPaid += Number(e.amount);

    const allStats = Object.values(statsMap);
    const groupStats: GroupStats = {
      totalEvents: groupEvents.length, oldestJoin: "", newestJoin: "",
      maxEventsCreated: Math.max(0, ...allStats.map((s) => s.eventsCreated)),
      maxContributions: Math.max(0, ...allStats.map((s) => s.contributions)),
      maxExpensesPaid:  Math.max(0, ...allStats.map((s) => s.expensesPaid)),
      memberCount: groupMembers.length,
    };
    const myStats = statsMap[user.id];
    if (!myStats) continue;

    const tagKeys = assignTags({ userId: user.id, ...myStats }, groupStats);
    const maxAtt = Math.max(1, ...allStats.map((s) => s.attendance));
    const score = (s: Stats) =>
      (s.attendance / maxAtt) * 0.4 +
      (groupStats.maxContributions > 0 ? s.contributions / groupStats.maxContributions : 0) * 0.3 +
      (groupStats.maxExpensesPaid > 0 ? s.expensesPaid / groupStats.maxExpensesPaid : 0) * 0.3;
    const myScore = score(myStats);
    const topScore = Math.max(...allStats.map(score));
    if (myScore > 0 && myScore === topScore && !tagKeys.includes("mvp")) tagKeys.unshift("mvp");

    for (const key of tagKeys) allBadges.push({ tagKey: key, groupName });
  }

  return (
    <div className="max-w-2xl mx-auto pb-8">
      <PersonalSummary name={resolvedName || "Vos"} debes={debes} teDebon={teDebon} attended={attended} totalEvents={totalEvents} />
      <PendingDebts debts={pendingDebts} />
      <UpcomingJuntadas initialEvents={upcomingEvents} userId={user.id} />
      <RecentActivity items={recentActivity} />
      <MyGroups initialGroups={myGroups} />
      <MyBadges badges={allBadges} />
    </div>
  );
}
