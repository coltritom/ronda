import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PersonalSummary } from "@/components/home/PersonalSummary";
import { PendingDebts } from "@/components/home/PendingDebts";
import { UpcomingJuntadas } from "@/components/home/UpcomingJuntadas";
import { RecentActivity } from "@/components/home/RecentActivity";
import { MyGroups } from "@/components/home/MyGroups";
import { MyBadges, assignTags, type Badge, type MemberInput, type GroupStats } from "@/components/home/MyBadges";
import type { DebtItem } from "@/components/home/PendingDebts";
import type { ActivityItem } from "@/components/home/RecentActivity";
import type { UpcomingEvent, RSVPStatus } from "@/components/home/UpcomingJuntadas";

const DATE_FMT = new Intl.DateTimeFormat("es-AR", {
  weekday: "short", day: "numeric", month: "short",
  timeZone: "America/Argentina/Buenos_Aires",
});

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) redirect("/login");

  const { data: hd } = await supabase.rpc("get_home_data", { p_user_id: user.id });

  // ── Profile name ──────────────────────────────────────────────────────────
  const rawName: string = hd?.profile_name ?? "";
  const isEmailInName = rawName.includes("@");
  const metaName: string =
    user.user_metadata?.display_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name || "";
  const resolvedName = isEmailInName ? metaName : rawName;
  if (isEmailInName && metaName) {
    supabase.from("profiles").update({ name: metaName }).eq("id", user.id);
  }

  // ── Groups ────────────────────────────────────────────────────────────────
  type RawGroup = { id: string; name: string; emoji: string | null };
  const myGroups = ((hd?.groups ?? []) as RawGroup[]).map((g) => ({
    id: g.id,
    name: g.name,
    emoji: g.emoji ?? g.name.charAt(0).toUpperCase(),
  }));

  if (!hd || myGroups.length === 0) {
    return (
      <div className="max-w-2xl mx-auto pb-8">
        <PersonalSummary name={resolvedName || "Vos"} debes={0} teDebon={0} attended={0} totalEvents={0} />
        <UpcomingJuntadas initialEvents={[]} userId={user.id} />
        <MyGroups initialGroups={[]} />
      </div>
    );
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const summary = hd.summary as { debes: number; te_debon: number; attended: number; total_events: number };

  // ── Pending debts ─────────────────────────────────────────────────────────
  type RawDebt = { event_id: string; group_id: string; group_name: string; group_emoji: string; payer_name: string; amount: number };
  const pendingDebts: DebtItem[] = ((hd.pending_debts ?? []) as RawDebt[]).map((d) => ({
    eventId: d.event_id,
    groupId: d.group_id,
    groupName: d.group_name,
    groupEmoji: d.group_emoji,
    payerName: d.payer_name,
    amount: d.amount,
  }));

  // ── Upcoming events ───────────────────────────────────────────────────────
  type RawEvent = { id: string; name: string; date: string; group_id: string; group_name: string; group_emoji: string; going: number; maybe: number; not_going: number; member_count: number; my_rsvp: string };
  const upcomingEvents: UpcomingEvent[] = ((hd.upcoming_events ?? []) as RawEvent[]).map((e) => ({
    id: e.id,
    name: e.name,
    date: DATE_FMT.format(new Date(e.date)),
    groupId: e.group_id,
    groupName: e.group_name,
    groupEmoji: e.group_emoji,
    confirmed: e.going,
    noResponse: Math.max(0, e.member_count - e.going - e.maybe - e.not_going),
    myRsvp: e.my_rsvp as RSVPStatus,
  }));

  // ── Recent activity ───────────────────────────────────────────────────────
  type RawActivity = { id: string; type: string; actor_name: string; group_name: string; event_name: string | null; event_date: string | null; created_at: string };
  const recentActivity: ActivityItem[] = ((hd.recent_activity ?? []) as RawActivity[]).map((a) => ({
    id: a.id,
    type: a.type as ActivityItem["type"],
    actorName: a.actor_name,
    groupName: a.group_name,
    eventName: a.event_name ?? undefined,
    eventDate: a.event_date ? DATE_FMT.format(new Date(a.event_date)) : undefined,
    createdAt: a.created_at,
  }));

  // ── Badges ────────────────────────────────────────────────────────────────
  type RawBadgeGroup = {
    group_id: string; group_name: string; total_events: number; member_count: number;
    my_attendance: number; my_maybe: number; my_events_created: number;
    my_contributions: number; my_expenses_paid: number;
    max_events_created: number; max_contributions: number; max_expenses_paid: number;
    my_score: number; top_score: number;
  };
  const allBadges: Badge[] = [];
  for (const bg of (hd.badge_groups ?? []) as RawBadgeGroup[]) {
    const member: MemberInput = {
      userId: user.id,
      attendance: bg.my_attendance,
      maybeCount: bg.my_maybe,
      eventsCreated: bg.my_events_created,
      contributions: bg.my_contributions,
      expensesPaid: bg.my_expenses_paid,
    };
    const group: GroupStats = {
      totalEvents: bg.total_events,
      oldestJoin: "",
      newestJoin: "",
      maxEventsCreated: bg.max_events_created,
      maxContributions: bg.max_contributions,
      maxExpensesPaid: bg.max_expenses_paid,
      memberCount: bg.member_count,
    };
    const tagKeys = assignTags(member, group);
    if (bg.my_score > 0 && Math.abs(bg.my_score - bg.top_score) < 0.0001 && !tagKeys.includes("mvp")) {
      tagKeys.unshift("mvp");
    }
    for (const key of tagKeys) allBadges.push({ tagKey: key, groupName: bg.group_name });
  }

  return (
    <div className="max-w-2xl mx-auto pb-8">
      <PersonalSummary
        name={resolvedName || "Vos"}
        debes={summary.debes}
        teDebon={summary.te_debon}
        attended={summary.attended}
        totalEvents={summary.total_events}
      />
      <PendingDebts debts={pendingDebts} />
      <UpcomingJuntadas initialEvents={upcomingEvents} userId={user.id} />
      <RecentActivity items={recentActivity} />
      <MyGroups initialGroups={myGroups} />
      <MyBadges badges={allBadges} />
    </div>
  );
}
