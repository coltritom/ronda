export const MEMBER_COLORS = ["fuego", "uva", "menta", "ambar", "rosa"] as const;

export const GROUP_EMOJIS = ["🔥", "⚽", "🏖️", "🎮", "🍕", "🍺", "🎯", "🏀", "🎸", "🏠", "🚗", "🎂", "🌴", "🎉", "🐾"] as const;

export function getMemberColor(index: number): string {
  return MEMBER_COLORS[index % MEMBER_COLORS.length];
}


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
