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

// ─── Aportes store ────────────────────────────────────────────────────────────
export interface AporteEntry {
  memberId: string;
  categoryId: string;
  note?: string;
}

const aportesStore: Record<string, AporteEntry[]> = {};

export function getAportes(juntadaId: string): AporteEntry[] | undefined {
  return aportesStore[juntadaId];
}

export function saveAportes(juntadaId: string, aportes: AporteEntry[]): void {
  aportesStore[juntadaId] = aportes;
}

// ─── Gastos store ─────────────────────────────────────────────────────────────
export interface GastoEntry {
  desc: string;
  amount: number;
  who: string;
  memberIds: string[];
}

const gastosStore: Record<string, GastoEntry[]> = {};

export function getGastos(juntadaId: string): GastoEntry[] | undefined {
  return gastosStore[juntadaId];
}

export function addGasto(juntadaId: string, gasto: GastoEntry): void {
  if (!gastosStore[juntadaId]) gastosStore[juntadaId] = [];
  gastosStore[juntadaId] = [...gastosStore[juntadaId], gasto];
}

export function removeGasto(juntadaId: string, index: number): void {
  if (!gastosStore[juntadaId]) return;
  gastosStore[juntadaId] = gastosStore[juntadaId].filter((_, i) => i !== index);
}

export function updateGasto(juntadaId: string, index: number, gasto: GastoEntry): void {
  if (!gastosStore[juntadaId]) return;
  gastosStore[juntadaId] = gastosStore[juntadaId].map((g, i) => i === index ? gasto : g);
}

export function computeDeudas(
  gastos: GastoEntry[],
  members: { id: string; name: string }[]
): Deuda[] {
  const balance: Record<string, number> = {};
  members.forEach((m) => { balance[m.id] = 0; });

  for (const g of gastos) {
    const payerId = members.find((m) => m.name === g.who)?.id;
    if (!payerId) continue;

    const splitIds = g.memberIds.length > 0 ? g.memberIds : members.map((m) => m.id);
    const share = g.amount / splitIds.length;

    balance[payerId] += g.amount;
    for (const id of splitIds) {
      balance[id] = (balance[id] ?? 0) - share;
    }
  }

  const creditors: { id: string; amt: number }[] = [];
  const debtors: { id: string; amt: number }[] = [];

  for (const [id, bal] of Object.entries(balance)) {
    if (bal > 0.5) creditors.push({ id, amt: bal });
    else if (bal < -0.5) debtors.push({ id, amt: -bal });
  }

  creditors.sort((a, b) => b.amt - a.amt);
  debtors.sort((a, b) => b.amt - a.amt);

  const deudas: Deuda[] = [];
  let ci = 0, di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];
    const amount = Math.min(creditor.amt, debtor.amt);

    deudas.push({ fromId: debtor.id, toId: creditor.id, amount: Math.round(amount) });

    creditor.amt -= amount;
    debtor.amt -= amount;

    if (creditor.amt < 0.5) ci++;
    if (debtor.amt < 0.5) di++;
  }

  return deudas;
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
