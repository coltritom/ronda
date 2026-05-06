import { Pill } from "@/components/ui/Pill";

export const TAG_DEFS = {
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

export type TagKey = keyof typeof TAG_DEFS;

export interface Badge {
  tagKey: TagKey;
  groupName: string;
}

export interface MemberInput {
  userId: string;
  attendance: number;
  maybeCount: number;
  eventsCreated: number;
  contributions: number;
  expensesPaid: number;
}

export interface GroupStats {
  totalEvents: number;
  oldestJoin: string;
  newestJoin: string;
  maxEventsCreated: number;
  maxContributions: number;
  maxExpensesPaid: number;
  memberCount: number;
}

export function assignTags(member: MemberInput, group: GroupStats): TagKey[] {
  const tags: TagKey[] = [];
  const { totalEvents } = group;

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

export function MyBadges({ badges }: { badges: Badge[] }) {
  if (badges.length === 0) return null;

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
