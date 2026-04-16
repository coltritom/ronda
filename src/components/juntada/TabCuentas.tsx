import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { MOCK_MEMBERS } from "@/lib/constants";
import { fmtARS } from "@/lib/utils";

interface Deuda {
  fromId: string;
  toId: string;
  amount: number;
  paid: boolean;
}

const MOCK_DEUDAS: Deuda[] = [
  { fromId: "2", toId: "1", amount: 2400, paid: false },
  { fromId: "5", toId: "3", amount: 2400, paid: false },
  { fromId: "4", toId: "1", amount: 1800, paid: true },
];

export function TabCuentas({ closed = false, isNew = false }: { closed?: boolean; isNew?: boolean }) {
  if (isNew) {
    return (
      <div className="px-4 md:px-6 py-10 text-center">
        <p className="text-sm text-niebla">
          Primero registrá la asistencia y cargá los gastos. Después podés cerrar las cuentas.
        </p>
      </div>
    );
  }

  const allPaid = MOCK_DEUDAS.every((d) => d.paid);

  if (allPaid || closed) {
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
        {MOCK_DEUDAS.map((d, i) => {
          const from = MOCK_MEMBERS.find((m) => m.id === d.fromId)!;
          const to = MOCK_MEMBERS.find((m) => m.id === d.toId)!;
          return (
            <div key={i} className={`bg-noche-media rounded-2xl p-4 ${d.paid ? "opacity-50" : ""}`}>
              <div className="flex items-center gap-2 mb-3">
                <Avatar emoji={from.emoji} name={from.name} colorIndex={from.colorIndex} />
                <span className="text-lg text-niebla">→</span>
                <Avatar emoji={to.emoji} name={to.name} colorIndex={to.colorIndex} />
              </div>
              {d.paid ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-exito text-base">✓</span>
                  <span className="text-sm font-semibold text-exito">Cuenta cerrada. Estás en paz.</span>
                </div>
              ) : (
                <>
                  <p className="font-semibold text-[15px] text-humo">{from.name} le debe a {to.name}</p>
                  <p className="font-bold text-[22px] text-humo mt-1 mb-3">${fmtARS(d.amount)}</p>
                  <Button primary={false} full>Marcar como pagado</Button>
                </>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-niebla text-center mt-4">
        Ronda simplificó las cuentas para que haya menos transferencias.
      </p>
    </div>
  );
}
