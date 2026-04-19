import type { JuntadaItem } from "./constants";

// Store en memoria para juntadas creadas durante la sesión (sin backend).
// Persiste mientras el módulo esté cacheado (misma sesión de navegación).

const dynamicJuntadas: Record<string, JuntadaItem[]> = {};

export function addJuntada(groupId: string, juntada: JuntadaItem): void {
  if (!dynamicJuntadas[groupId]) dynamicJuntadas[groupId] = [];
  dynamicJuntadas[groupId] = [juntada, ...dynamicJuntadas[groupId]];
}

export function getNewJuntadas(groupId: string): JuntadaItem[] {
  return dynamicJuntadas[groupId] ?? [];
}

// ─── RSVP store ───────────────────────────────────────────────────────────────
export type RSVPStatus = "none" | "voy" | "no-voy" | "no-se";

const rsvpStore: Record<string, RSVPStatus> = {};

export function getRSVP(juntadaId: string): RSVPStatus {
  return rsvpStore[juntadaId] ?? "none";
}

export function setRSVP(juntadaId: string, status: RSVPStatus): void {
  rsvpStore[juntadaId] = status;
}

// ─── Deudas store ─────────────────────────────────────────────────────────────
export interface Deuda {
  fromId: string;
  toId: string;
  amount: number;
}

const DEFAULT_DEUDAS: Deuda[] = [
  { fromId: "2", toId: "1", amount: 2400 },
  { fromId: "5", toId: "3", amount: 2400 },
];

const deudasStore: Record<string, Deuda[]> = {};

export function getDeudas(juntadaId: string): Deuda[] {
  if (!(juntadaId in deudasStore)) {
    deudasStore[juntadaId] = [...DEFAULT_DEUDAS];
  }
  return deudasStore[juntadaId];
}

export function markDeudaPaid(juntadaId: string, index: number): void {
  if (!(juntadaId in deudasStore)) {
    deudasStore[juntadaId] = [...DEFAULT_DEUDAS];
  }
  deudasStore[juntadaId] = deudasStore[juntadaId].filter((_, i) => i !== index);
}

// ─── Avatar store ─────────────────────────────────────────────────────────────
let _avatarEmoji = "🙋‍♂️";

export function getAvatarEmoji(): string {
  return _avatarEmoji;
}

export function setAvatarEmoji(emoji: string): void {
  _avatarEmoji = emoji;
}

// ─── Dynamic groups store ─────────────────────────────────────────────────────
export interface DynamicGroup {
  id: string;
  name: string;
  emoji: string;
  memberCount: number;
  lastActivity: string;
  pendingCount: number;
  pendingAmount: number;
}

const dynamicGroups: DynamicGroup[] = [];

export function addGroup(group: DynamicGroup): void {
  dynamicGroups.unshift(group);
}

export function getDynamicGroup(id: string): DynamicGroup | undefined {
  return dynamicGroups.find((g) => g.id === id);
}

export function getDynamicGroups(): DynamicGroup[] {
  return [...dynamicGroups];
}
