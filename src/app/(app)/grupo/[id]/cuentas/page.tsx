"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { getGroup } from "@/lib/constants";
import { fmtARS } from "@/lib/utils";

interface Deuda {
  fromId: string;
  toId: string;
  amount: number;
  paid: boolean;
}

// 2 pendientes ($2.400 + $2.400 = $4.800) — consistente con PendingAlert del grupo
const MOCK_DEUDAS: Deuda[] = [
  { fromId: "2", toId: "1", amount: 2400, paid: false },
  { fromId: "5", toId: "3", amount: 2400, paid: false },
  { fromId: "4", toId: "1", amount: 1800, paid: true },
  { fromId: "8", toId: "3", amount: 900,  paid: true },
  { fromId: "7", toId: "1", amount: 1500, paid: true },
];

export default function CuentasGlobalesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const group = getGroup(id);
  const memberIds = new Set(group?.members.map((m) => m.id) ?? []);
  const [deudas, setDeudas] = useState(
    MOCK_DEUDAS.filter((d) => memberIds.has(d.fromId) && memberIds.has(d.toId))
  );

  if (!group) {
    return (
      <div className="max-w-lg mx-auto px-4 md:px-6 pt-8 pb-8 text-center">
        <p className="text-sm text-niebla mb-4">Grupo no encontrado.</p>
        <a href="/home" className="text-fuego text-sm font-semibold">Ir al inicio</a>
      </div>
    );
  }

  const pendientes = deudas.filter((d) => !d.paid);
  const pagadas = deudas.filter((d) => d.paid);
  const totalPendiente = pendientes.reduce((s, d) => s + d.amount, 0);
  const allClear = pendientes.length === 0;

  const markPaid = (index: number) => {
    setDeudas((prev) => {
      const next = [...prev];
      const realIndex = prev.findIndex(
        (d) => !d.paid && d.fromId === pendientes[index].fromId && d.toId === pendientes[index].toId
      );
      if (realIndex >= 0) next[realIndex] = { ...next[realIndex], paid: true };
      return next;
    });
  };

  return (
    <div className="max-w-lg mx-auto pb-8">
      <div className="px-4 md:px-6 pt-4 pb-2">
        <button
          onClick={() => router.push(`/grupo/${id}`)}
          className="flex items-center gap-1 text-fuego text-[13px] font-semibold bg-transparent border-none cursor-pointer p-0 mb-3"
        >
          <ChevronLeft size={16} />
          {group.name}
        </button>
        <h1 className="font-display font-semibold text-xl text-humo">
          Cuentas del grupo
        </h1>
        <p className="text-sm text-niebla mt-1">
          Así quedaron los números.
        </p>
      </div>

      <div className="px-4 md:px-6 flex flex-col gap-3 mt-2">
        {allClear ? (
          <div className="bg-noche-media rounded-2xl p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-menta/[0.12] flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">✓</span>
            </div>
            <p className="font-semibold text-base text-humo">Todo cerrado</p>
            <p className="text-sm text-niebla mt-1">No hay cuentas pendientes. Amistad preservada.</p>
          </div>
        ) : (
          <div className="bg-noche-media rounded-2xl p-4 text-center">
            <p className="text-[13px] text-niebla">Cuentas pendientes</p>
            <p className="font-display font-bold text-[28px] text-humo mt-1">
              ${fmtARS(totalPendiente)}
            </p>
            <p className="text-[13px] text-niebla mt-0.5">
              {pendientes.length} transferencia{pendientes.length > 1 ? "s" : ""} pendiente{pendientes.length > 1 ? "s" : ""}
            </p>
          </div>
        )}

        <PersonalSummary deudas={deudas} />

        {pendientes.length > 0 && (
          <>
            <p className="text-[11px] font-semibold text-niebla uppercase tracking-wider mt-2">
              Pendientes
            </p>
            {pendientes.map((d, i) => (
              <DeudaCard key={`p-${i}`} deuda={d} members={group.members} onMarkPaid={() => markPaid(i)} />
            ))}
          </>
        )}

        {pagadas.length > 0 && (
          <>
            <p className="text-[11px] font-semibold text-niebla uppercase tracking-wider mt-4">
              Cerradas
            </p>
            {pagadas.map((d, i) => (
              <DeudaCard key={`c-${i}`} deuda={d} members={group.members} />
            ))}
          </>
        )}

        <p className="text-xs text-niebla text-center mt-2">
          Ronda simplificó las cuentas para que haya menos transferencias.
        </p>
      </div>
    </div>
  );
}

function PersonalSummary({ deudas }: { deudas: Deuda[] }) {
  const myId = "7";
  const myDebts = deudas.filter((d) => d.fromId === myId && !d.paid);
  const myCredits = deudas.filter((d) => d.toId === myId && !d.paid);
  const totalDebt = myDebts.reduce((s, d) => s + d.amount, 0);
  const totalCredit = myCredits.reduce((s, d) => s + d.amount, 0);

  if (totalDebt === 0 && totalCredit === 0) return null;

  return (
    <div className="bg-noche-media rounded-2xl p-4">
      <p className="text-[11px] font-semibold text-niebla uppercase tracking-wider mb-3">
        Tu resumen
      </p>
      <div className="flex gap-4">
        {totalDebt > 0 && (
          <div className="flex-1 bg-noche rounded-xl p-3 text-center">
            <p className="text-xs text-niebla mb-0.5">Debés</p>
            <p className="font-bold text-lg text-humo">${fmtARS(totalDebt)}</p>
          </div>
        )}
        {totalCredit > 0 && (
          <div className="flex-1 bg-noche rounded-xl p-3 text-center">
            <p className="text-xs text-niebla mb-0.5">Te deben</p>
            <p className="font-bold text-lg text-humo">${fmtARS(totalCredit)}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DeudaCard({ deuda, members, onMarkPaid }: { deuda: Deuda; members: { id: string; name: string; emoji: string; colorIndex: number }[]; onMarkPaid?: () => void }) {
  const from = members.find((m) => m.id === deuda.fromId)!;
  const to = members.find((m) => m.id === deuda.toId)!;

  return (
    <div className={`bg-noche-media rounded-2xl p-4 ${deuda.paid ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-2 mb-3">
        <Avatar emoji={from.emoji} name={from.name} colorIndex={from.colorIndex} />
        <span className="text-lg text-niebla">→</span>
        <Avatar emoji={to.emoji} name={to.name} colorIndex={to.colorIndex} />
      </div>

      {deuda.paid ? (
        <div className="flex items-center gap-1.5">
          <span className="text-exito text-base">✓</span>
          <span className="text-sm font-semibold text-exito">Cuenta cerrada. Estás en paz.</span>
        </div>
      ) : (
        <>
          <p className="font-semibold text-[15px] text-humo">
            {from.name} le debe a {to.name}
          </p>
          <p className="font-bold text-[22px] text-humo mt-1 mb-3">
            ${fmtARS(deuda.amount)}
          </p>
          <Button primary={false} full onClick={onMarkPaid}>
            Marcar como pagado
          </Button>
        </>
      )}
    </div>
  );
}
