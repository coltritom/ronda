"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Minus } from "lucide-react";
import { createClient } from "@/lib/supabase/clients";

type RSVPStatus = "going" | "maybe" | "not_going" | "none";

const CHIPS: { id: Exclude<RSVPStatus, "none">; label: string; icon: typeof Check; symbol: string }[] = [
  { id: "going",     label: "Voy",    icon: Check, symbol: "✓" },
  { id: "not_going", label: "No voy", icon: X,     symbol: "✗" },
  { id: "maybe",     label: "No sé",  icon: Minus, symbol: "—" },
];

interface UpcomingEvent {
  id: string;
  name: string;
  date: string;
  groupId: string;
  groupName: string;
  groupEmoji: string;
  confirmed: number;
  noResponse: number;
  myRsvp: RSVPStatus;
}

export function UpcomingJuntadas() {
  const router = useRouter();
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [rsvpMap, setRsvpMap] = useState<Record<string, RSVPStatus>>({});

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

      const NOW = new Date().toISOString();

      const { data: eventsRaw } = await supabase
        .from("events")
        .select("id, name, date, group_id, groups(name), event_rsvps(user_id, response)")
        .in("group_id", groupIds)
        .neq("status", "cancelled")
        .gte("date", NOW)
        .order("date", { ascending: true })
        .limit(5);

      if (!eventsRaw?.length) return;

      const [membersResult, emojiResult] = await Promise.all([
        supabase.from("group_members").select("group_id").in("group_id", groupIds),
        supabase.from("groups").select("id, emoji").in("id", groupIds),
      ]);

      const memberCountByGroup: Record<string, number> = {};
      for (const m of membersResult.data ?? []) {
        memberCountByGroup[m.group_id] = (memberCountByGroup[m.group_id] ?? 0) + 1;
      }

      const emojiMap: Record<string, string> = {};
      for (const row of emojiResult.data ?? []) {
        if ((row as { id: string; emoji?: string }).emoji)
          emojiMap[row.id] = (row as { id: string; emoji: string }).emoji;
      }

      const mapped: UpcomingEvent[] = eventsRaw.map((e) => {
        const g = Array.isArray(e.groups) ? e.groups[0] : e.groups;
        const gTyped = g as { name: string } | null;
        const groupName = gTyped?.name ?? "Grupo";
        const groupEmoji = emojiMap[e.group_id] ?? groupName.charAt(0).toUpperCase();
        const rsvps = (e.event_rsvps as { user_id: string; response: string }[]) ?? [];
        const going = rsvps.filter((r) => r.response === "going").length;
        const maybe = rsvps.filter((r) => r.response === "maybe").length;
        const declined = rsvps.filter((r) => r.response === "not_going").length;
        const memberCount = memberCountByGroup[e.group_id] ?? 0;
        const noResponse = Math.max(0, memberCount - going - maybe - declined);
        const myRsvpRow = rsvps.find((r) => r.user_id === user.id);
        const myRsvp: RSVPStatus = (myRsvpRow?.response as RSVPStatus) ?? "none";

        const formattedDate = new Intl.DateTimeFormat("es-AR", {
          weekday: "short",
          day: "numeric",
          month: "short",
          timeZone: "America/Argentina/Buenos_Aires",
        }).format(new Date(e.date));

        return {
          id: e.id,
          name: e.name,
          date: formattedDate,
          groupId: e.group_id,
          groupName,
          groupEmoji,
          confirmed: going,
          noResponse,
          myRsvp,
        };
      });

      setEvents(mapped);
      const map: Record<string, RSVPStatus> = {};
      for (const e of mapped) map[e.id] = e.myRsvp;
      setRsvpMap(map);
    }
    load();
  }, []);

  const handleRSVP = async (eventId: string, status: RSVPStatus) => {
    setRsvpMap((prev) => ({ ...prev, [eventId]: status }));
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (status === "none") {
      await supabase
        .from("event_rsvps")
        .delete()
        .eq("event_id", eventId)
        .eq("user_id", user.id);
    } else {
      await supabase.from("event_rsvps").upsert(
        { event_id: eventId, user_id: user.id, response: status },
        { onConflict: "event_id,user_id" }
      );
    }
  };

  if (events.length === 0) {
    return (
      <div className="px-4 md:px-6 mb-3">
        <p className="font-display font-semibold text-[15px] text-carbon dark:text-humo mb-2">
          Próximas juntadas
        </p>
        <div className="bg-noche-media dark:bg-noche-media bg-crema rounded-2xl p-5 text-center">
          <p className="text-sm text-gris-cal dark:text-niebla">
            No hay juntadas armadas. ¿Armás una?
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 mb-3">
      <p className="font-display font-semibold text-[15px] text-carbon dark:text-humo mb-2">
        Próximas juntadas
      </p>

      <div className="flex flex-col gap-2">
        {events.map((j) => {
          const status = rsvpMap[j.id] ?? "none";
          const chipData = CHIPS.find((c) => c.id === status);

          return (
            <div key={j.id} className="bg-noche-media dark:bg-noche-media bg-crema rounded-2xl p-3.5">
              <div className="flex items-start justify-between mb-1.5">
                <div className="flex-1">
                  <p className="text-[11px] text-gris-cal dark:text-niebla m-0">
                    {j.groupEmoji} {j.groupName}
                  </p>
                  <p className="font-semibold text-sm text-carbon dark:text-humo mt-0.5">
                    {j.name}
                  </p>
                  <p className="text-xs text-gris-cal dark:text-niebla mt-0.5">
                    {j.date}
                    {j.confirmed > 0 && ` · ${j.confirmed} van`}
                    {j.noResponse > 0 && ` · ${j.noResponse} sin respuesta`}
                  </p>
                </div>
                <button
                  onClick={() => router.push(`/grupo/${j.groupId}`)}
                  className="text-[11px] font-semibold text-fuego bg-transparent border-none cursor-pointer shrink-0 ml-2"
                >
                  Ver grupo →
                </button>
              </div>

              {status !== "none" && chipData ? (
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1.5">
                    <div className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-xs
                      ${status === "going"     ? "bg-menta/20 text-menta"   : ""}
                      ${status === "not_going" ? "bg-error/15 text-error"   : ""}
                      ${status === "maybe"     ? "bg-niebla/15 text-niebla" : ""}
                    `}>
                      {chipData.symbol}
                    </div>
                    <span className="text-xs font-medium text-carbon dark:text-humo">
                      {status === "going" ? "Vas" : status === "not_going" ? "No vas" : "No sabés"}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRSVP(j.id, "none")}
                    className="text-[11px] font-semibold text-fuego bg-transparent border-none cursor-pointer"
                  >
                    Cambiar
                  </button>
                </div>
              ) : (
                <div className="flex gap-1.5 mt-2">
                  {CHIPS.map((chip) => {
                    const Icon = chip.icon;
                    return (
                      <button
                        key={chip.id}
                        onClick={() => handleRSVP(j.id, chip.id)}
                        className="
                          flex-1 flex items-center justify-center gap-1 py-2 rounded-full
                          text-xs font-semibold border-none cursor-pointer transition-all
                          bg-white/5 dark:bg-white/5 bg-black/5
                          text-gris-cal dark:text-niebla
                          hover:bg-white/10 active:scale-[0.97]
                        "
                      >
                        <Icon size={13} strokeWidth={2.5} />
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
