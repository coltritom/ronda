"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { MOCK_MEMBERS } from "@/lib/constants";
import { getDeudas, getGastos, computeDeudas, getGuests, type Deuda } from "@/lib/store";
import { fmtARSExact } from "@/lib/utils";
import { ConfirmPagoModal } from "@/components/juntada/ConfirmPagoModal";

interface Props {
  closed?: boolean;
  isNew?: boolean;
  juntadaId: string;
  juntadaName?: string;
}

function GuestBadge() {
  return (
    <span className="ml-1 text-[10px] font-normal text-niebla/50 bg-white/[0.06] px-1.5 py-0.5 rounded-full align-middle">
      invitado
    </span>
  );
}

export function TabCuentas({ closed = false, isNew = false, juntadaId, juntadaName }: Props) {
  const guests = getGuests(juntadaId);
  const allMembers = [
    ...MOCK_MEMBERS,
    ...guests.map((g) => ({ id: g.id, name: g.name, emoji: "👤", colorIndex: 3 })),
  ];

  const [deudas, setDeudas] = useState<Deuda[]>(() => {
    const gastos = getGastos(juntadaId);
    if (gastos && gastos.length > 0) return computeDeudas(gastos, allMembers, juntadaId);
    return getDeudas(juntadaId);
  });
  const [confirmIdx, setConfirmIdx] = useState<number | null>(null);

  const handleConfirmPaid = () => {
    if (confirmIdx === null) return;
    setDeudas((prev) => prev.filter((_, i) => i !== confirmIdx));
    setConfirmIdx(null);
  };

  if (isNew) {
    return (
      <div className="px-4 md:px-6 py-10 text-center">
        <p className="text-sm text-niebla">
          Primero registrá la asistencia y cargá los gastos. Después podés cerrar las cuentas.
        </p>
      </div>
    );
  }

  if (closed || deudas.length === 0) {
    return (
      <div className="px-4 md:px-6 py-10 text-center">
        <div className="w-14 h-14 rounded-full bg-menta/[0.12] flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl">✓</span>
        </div>
        <p className="font-semibold text-base text-humo">Cuentas cerradas</p>
        <p className="text-sm text-niebla mt-1">Amistad preservada.</p>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 py-4">
      <p className="text-sm text-niebla mb-4">Así quedaron los números.</p>
      <div className="flex flex-col gap-3">
        {deudas.map((d, i) => {
          const from = allMembers.find((m) => m.id === d.fromId)!;
          const to = allMembers.find((m) => m.id === d.toId)!;
          const fromIsGuest = guests.some((g) => g.id === d.fromId);
          const toIsGuest = guests.some((g) => g.id === d.toId);
          return (
            <div key={`${d.fromId}-${d.toId}-${i}`} className="bg-noche-media rounded-2xl p-4 flex flex-col gap-4">
              {/* Involucrados */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Avatar emoji={from.emoji} name={from.name} colorIndex={from.colorIndex} />
                  <span className="text-lg text-niebla">→</span>
                  <Avatar emoji={to.emoji} name={to.name} colorIndex={to.colorIndex} />
                </div>
                <p className="font-semibold text-[15px] text-humo">
                  {from.name}{fromIsGuest && <GuestBadge />}
                  {" le debe a "}
                  {to.name}{toIsGuest && <GuestBadge />}
                </p>
                {juntadaName && (
                  <p className="text-xs text-niebla/60 mt-0.5">por {juntadaName}</p>
                )}
              </div>

              {/* Monto */}
              <p className="font-bold text-[28px] text-humo leading-none">${fmtARSExact(d.amount)}</p>

              {/* Acción */}
              <Button primary={false} full onClick={() => setConfirmIdx(i)}>
                Marcar como pagado
              </Button>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-niebla text-center mt-4">
        Ronda simplificó las cuentas para que haya menos transferencias.
      </p>

      {confirmIdx !== null && deudas[confirmIdx] && (() => {
        const d = deudas[confirmIdx];
        const from = allMembers.find((m) => m.id === d.fromId)!;
        const to = allMembers.find((m) => m.id === d.toId)!;
        return (
          <ConfirmPagoModal
            open
            onClose={() => setConfirmIdx(null)}
            onConfirm={handleConfirmPaid}
            from={from}
            to={to}
            amountLabel={`$${fmtARSExact(d.amount)}`}
          />
        );
      })()}
    </div>
  );
}
