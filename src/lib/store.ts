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
