export const TAG_DEFS = {
  veterano:    { label: "El Veterano",        emoji: "🏆", color: "ambar", desc: "El miembro con más antigüedad en el grupo." },
  nuevo:       { label: "El Nuevo",           emoji: "🌱", color: "menta", desc: "El integrante que se sumó más recientemente." },
  organizador: { label: "El Organizador",     emoji: "📋", color: "uva",   desc: "El que más juntadas creó." },
  provisto:    { label: "El Provisto",        emoji: "🎒", color: "menta", desc: "El que más aportes llevó a las juntadas." },
  mecenas:     { label: "El Mecenas",         emoji: "💸", color: "ambar", desc: "El que más gastos pagó del grupo." },
  fijo:        { label: "El Fijo",            emoji: "📅", color: "menta", desc: "Fue al 80% o más de las juntadas." },
  fantasma:    { label: "El Fantasma",        emoji: "👻", color: "uva",   desc: "Apareció en el 20% o menos de las juntadas." },
  indeciso:    { label: "El Indeciso",        emoji: "🤷", color: "fuego", desc: "Respondió 'No sé' tres veces o más." },
  caradura:    { label: "El Cara Dura",       emoji: "😏", color: "rosa",  desc: "Fue a varias juntadas sin aportar ni pagar nada." },
  ausente:     { label: "El Ausente Digital", emoji: "📵", color: "uva",   desc: "Nunca confirmó ni rechazó una juntada." },
  mvp:         { label: "El MVP",             emoji: "⭐", color: "ambar", desc: "El que más contribuyó al grupo en general." },
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

const COLOR_CLASSES: Record<string, { bg: string; text: string }> = {
  fuego: { bg: "bg-fuego/[0.12]", text: "text-fuego" },
  ambar: { bg: "bg-ambar/[0.12]", text: "text-ambar" },
  menta: { bg: "bg-menta/[0.12]", text: "text-menta" },
  uva:   { bg: "bg-uva/[0.12]",   text: "text-uva"   },
  rosa:  { bg: "bg-rosa/[0.12]",  text: "text-rosa"  },
};

export function MyBadges({ badges }: { badges: Badge[] }) {
  if (badges.length === 0) return null;

  return (
    <div className="px-4 md:px-6 mb-3">
      <p className="font-display font-semibold text-[15px] text-carbon dark:text-humo mb-2">
        Tus etiquetas
      </p>
      <div className="flex flex-col gap-2">
        {badges.map((b, i) => {
          const def = TAG_DEFS[b.tagKey];
          const c = COLOR_CLASSES[def.color] ?? COLOR_CLASSES.fuego;
          return (
            <div key={i} className="flex items-center gap-3 bg-noche-media rounded-2xl px-4 py-3">
              <span className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-lg ${c.bg}`}>
                {def.emoji}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[13px] font-semibold ${c.text}`}>{def.label}</span>
                  <span className="text-[11px] text-niebla">· {b.groupName}</span>
                </div>
                <p className="text-[12px] text-niebla mt-0.5">{def.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
