export const MEMBER_COLORS = ["fuego", "uva", "menta", "ambar", "rosa"] as const;

export function getMemberColor(index: number): string {
  return MEMBER_COLORS[index % MEMBER_COLORS.length];
}

// Datos de ejemplo para desarrollo
export const MOCK_MEMBERS = [
  { id: "1", name: "Mati", emoji: "🧔", colorIndex: 0 },
  { id: "2", name: "Nico", emoji: "😎", colorIndex: 1 },
  { id: "3", name: "Lucía", emoji: "👩", colorIndex: 2 },
  { id: "4", name: "Sofi", emoji: "💃", colorIndex: 3 },
  { id: "5", name: "Facu", emoji: "🧑", colorIndex: 4 },
  { id: "6", name: "Caro", emoji: "👱‍♀️", colorIndex: 0 },
  { id: "7", name: "Tomi", emoji: "🙋‍♂️", colorIndex: 1 },
  { id: "8", name: "Juli", emoji: "🤙", colorIndex: 2 },
];

export const LUGAR_OPTIONS = [
  { id: "casa", emoji: "🏠", label: "Casa / Depto", needsHost: true },
  { id: "futbol5", emoji: "⚽", label: "Fútbol 5", needsHost: false },
  { id: "padel", emoji: "🎾", label: "Pádel", needsHost: false },
  { id: "basket", emoji: "🏀", label: "Básquet", needsHost: false },
  { id: "restaurant", emoji: "🍽️", label: "Restaurant / Bar", needsHost: false },
  { id: "parque", emoji: "🌳", label: "Parque / Plaza", needsHost: false },
  { id: "club", emoji: "🏟️", label: "Club / Cancha", needsHost: false },
  { id: "boliche", emoji: "🎶", label: "Boliche / Bar", needsHost: false },
  { id: "oficina", emoji: "💼", label: "After office", needsHost: false },
  { id: "viaje", emoji: "🚗", label: "Viaje / Escapada", needsHost: false },
  { id: "otro", emoji: "📍", label: "Otro", needsHost: false },
] as const;

export type LugarId = typeof LUGAR_OPTIONS[number]["id"];

export const APORTE_CATEGORIES = [
  { id: "comida", emoji: "🍽️", label: "Comida principal", weight: 5 },
  { id: "bebidas", emoji: "🍺", label: "Bebidas", weight: 3 },
  { id: "guarnicion", emoji: "🥗", label: "Guarnición / Ensaladas", weight: 2 },
  { id: "postre", emoji: "🍰", label: "Postre", weight: 2 },
  { id: "hielo", emoji: "🧊", label: "Hielo", weight: 1 },
  { id: "descartables", emoji: "🥤", label: "Vasos / Descartables", weight: 1 },
  { id: "carbon", emoji: "🔥", label: "Carbón / Leña", weight: 2 },
  { id: "snacks", emoji: "🍿", label: "Snacks / Picada", weight: 2 },
  { id: "pelota", emoji: "⚽", label: "Pelota", weight: 1 },
  { id: "equipo", emoji: "🎽", label: "Equipamiento / Pecheras", weight: 1 },
  { id: "lugar", emoji: "🏠", label: "Puso el lugar", weight: 5 },
  { id: "otro", emoji: "📦", label: "Otro", weight: 1 },
] as const;

export type AporteId = typeof APORTE_CATEGORIES[number]["id"];

// ─── Tipos reutilizables ───────────────────────────────────────────────────

export type JuntadaItem = {
  id: string;
  isoDate: string;
  date: string;
  name: string;
  attendees: number;
  totalSpent: number;
  closed: boolean;
  lugarId?: string;
  hostName?: string;
  confirmed?: number;
  unsure?: number;
  noResponse?: number;
};

type RankingEntry = {
  emoji: string;
  label: string;
  name: string;
  detail: string;
  memberEmoji: string;
  memberColorIndex: number;
  variant: "ambar" | "uva" | "rosa";
};

type GroupDetail = {
  pending: { count: number; amount: number } | null;
  juntadas: JuntadaItem[];
  ranking: RankingEntry[];
  wrapped: {
    totalJuntadas: number;
    totalSies: number;
    topPresente: string;
    topFantasma: string;
    fantasmaFaltas: number;
    topMisterioso: string;
    topMisteriosoDetalle: string;
    topSede: string;
    sedeVeces: number;
  } | null;
};

export const MOCK_GROUP_DETAILS: Record<string, GroupDetail> = {
  g1: {
    pending: { count: 2, amount: 4800 },
    juntadas: [
      { id: "j2-next", isoDate: "2026-04-19", date: "Sáb 19 abr, 20:00", name: "Asado del finde", attendees: 0, totalSpent: 0, closed: false, lugarId: "casa", hostName: "Mati", confirmed: 5, unsure: 1, noResponse: 2 },
      { id: "j1", isoDate: "2026-04-05", date: "Sáb 5 abr", name: "Pizzas + fútbol", attendees: 7, totalSpent: 12400, closed: false, lugarId: "restaurant" },
      { id: "j2", isoDate: "2026-03-29", date: "Sáb 29 mar", name: "Asado en lo de Mati", attendees: 6, totalSpent: 18200, closed: true, lugarId: "casa", hostName: "Mati" },
      { id: "j3", isoDate: "2026-03-15", date: "Sáb 15 mar", name: "Birras en casa de Nico", attendees: 5, totalSpent: 8600, closed: true, lugarId: "casa", hostName: "Nico" },
      { id: "j4", isoDate: "2026-03-08", date: "Sáb 8 mar", name: "Asado pre-feriado", attendees: 8, totalSpent: 22300, closed: true, lugarId: "casa", hostName: "Mati" },
      { id: "j5", isoDate: "2026-03-01", date: "Sáb 1 mar", name: "Pádel + birras", attendees: 4, totalSpent: 6800, closed: true, lugarId: "padel" },
      { id: "j6", isoDate: "2026-02-22", date: "Sáb 22 feb", name: "Cumple de Lucía", attendees: 8, totalSpent: 31500, closed: true, lugarId: "restaurant" },
      { id: "j7", isoDate: "2026-02-15", date: "Sáb 15 feb", name: "After office", attendees: 6, totalSpent: 9200, closed: true, lugarId: "oficina" },
      { id: "j8", isoDate: "2026-02-08", date: "Sáb 8 feb", name: "Fútbol 5 + asado", attendees: 7, totalSpent: 19800, closed: true, lugarId: "futbol5" },
    ],
    ranking: [
      { emoji: "🏆", label: "El más presente", name: "Mati", detail: "8/8 juntadas", memberEmoji: "🧔", memberColorIndex: 0, variant: "ambar" },
      { emoji: "👻", label: "Fantasma oficial", name: "Nico", detail: "faltó 5/8", memberEmoji: "😎", memberColorIndex: 1, variant: "uva" },
      { emoji: "💰", label: "La billetera", name: "Lucía", detail: "$42.000 en total", memberEmoji: "👩", memberColorIndex: 2, variant: "ambar" },
    ],
    wrapped: { totalJuntadas: 8, totalSies: 47, topPresente: "Mati", topFantasma: "Nico", fantasmaFaltas: 6, topMisterioso: "Facu", topMisteriosoDetalle: "siempre el último en confirmar", topSede: "Mati", sedeVeces: 5 },
  },
  g2: {
    pending: null,
    juntadas: [
      { id: "j3-next", isoDate: "2026-04-23", date: "Jue 23 abr, 21:00", name: "Fútbol miércoles", attendees: 0, totalSpent: 0, closed: false, lugarId: "futbol5", confirmed: 8, unsure: 2, noResponse: 1 },
      { id: "g2j1", isoDate: "2026-04-09", date: "Mié 9 abr", name: "Fútbol miércoles", attendees: 9, totalSpent: 3600, closed: true, lugarId: "futbol5" },
      { id: "g2j2", isoDate: "2026-04-02", date: "Mié 2 abr", name: "Fútbol miércoles", attendees: 10, totalSpent: 4000, closed: true, lugarId: "futbol5" },
      { id: "g2j3", isoDate: "2026-03-26", date: "Mié 26 mar", name: "Fútbol miércoles", attendees: 9, totalSpent: 3800, closed: true, lugarId: "futbol5" },
      { id: "g2j4", isoDate: "2026-03-19", date: "Mié 19 mar", name: "Fútbol miércoles", attendees: 8, totalSpent: 3200, closed: true, lugarId: "futbol5" },
      { id: "g2j5", isoDate: "2026-03-12", date: "Mié 12 mar", name: "Fútbol miércoles", attendees: 10, totalSpent: 4000, closed: true, lugarId: "futbol5" },
      { id: "g2j6", isoDate: "2026-03-05", date: "Mié 5 mar", name: "Fútbol miércoles", attendees: 9, totalSpent: 3600, closed: true, lugarId: "futbol5" },
    ],
    ranking: [
      { emoji: "⚽", label: "Capitán del campo", name: "Nico", detail: "10/10 partidos", memberEmoji: "😎", memberColorIndex: 1, variant: "ambar" },
      { emoji: "🦵", label: "El eterno lesionado", name: "Facu", detail: "faltó 4/10", memberEmoji: "🧑", memberColorIndex: 4, variant: "uva" },
      { emoji: "🥅", label: "El arquero del año", name: "Caro", detail: "siempre en el arco", memberEmoji: "👱‍♀️", memberColorIndex: 0, variant: "rosa" },
    ],
    wrapped: { totalJuntadas: 6, totalSies: 38, topPresente: "Nico", topFantasma: "Facu", fantasmaFaltas: 8, topMisterioso: "Caro", topMisteriosoDetalle: "nunca confirmaba a tiempo", topSede: "Nico", sedeVeces: 4 },
  },
  g3: {
    pending: { count: 1, amount: 3200 },
    juntadas: [
      { id: "j5", isoDate: "2026-03-15", date: "Sáb 15 mar", name: "Escapada a la costa", attendees: 5, totalSpent: 42000, closed: false, lugarId: "viaje" },
    ],
    ranking: [
      { emoji: "🏖️", label: "El organizador", name: "Lucía", detail: "armó todo el viaje", memberEmoji: "👩", memberColorIndex: 2, variant: "ambar" },
      { emoji: "💸", label: "La billetera", name: "Sofi", detail: "$28.000 adelantados", memberEmoji: "💃", memberColorIndex: 3, variant: "rosa" },
    ],
    wrapped: null,
  },
};

export const MOCK_GROUPS = [
  {
    id: "g1",
    name: "Los del asado",
    emoji: "🔥",
    memberCount: 8,
    lastActivity: "hace 2 días",
    pendingCount: 2,
    pendingAmount: 4800,
  },
  {
    id: "g2",
    name: "Fútbol 5 miércoles",
    emoji: "⚽",
    memberCount: 10,
    lastActivity: "hace 5 días",
    pendingCount: 0,
    pendingAmount: 0,
  },
  {
    id: "g3",
    name: "Depto vacaciones",
    emoji: "🏖️",
    memberCount: 5,
    lastActivity: "hace 2 sem",
    pendingCount: 1,
    pendingAmount: 3200,
  },
];
