interface DebtReminderProps {
  level: 1 | 2 | 3;
  name: string;
  amount: number;
}

const COPY = {
  1: (name: string, amount: string) => `Ey, te queda una cuenta pendiente con ${name}. ${amount}.`,
  2: (name: string, amount: string) => `Seguís debiendo ${amount} a ${name}. No te hagas el distraído.`,
  3: (name: string, amount: string) => `Dale, ${name} ya te miró 3 veces. Son ${amount}. Cerralo.`,
};

export function DebtReminder({ level, name, amount }: DebtReminderProps) {
  const formattedAmount = `$${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(amount)}`;
  const message = COPY[level](name, formattedAmount);

  return (
    <div className={`
      bg-noche-media rounded-2xl p-4
      ${level === 1 ? "border-l-[3px] border-alerta" : ""}
      ${level === 2 ? "border-l-[3px] border-fuego" : ""}
      ${level === 3 ? "border-l-[3px] border-error" : ""}
    `}>
      <p className="text-sm text-humo leading-relaxed">{message}</p>
      <div className="flex gap-2 mt-3">
        <button className="flex-1 py-2 rounded-xl bg-fuego text-white text-sm font-semibold border-none cursor-pointer">
          Pagar ahora
        </button>
        <button className="py-2 px-4 rounded-xl bg-transparent text-niebla text-sm border border-white/[0.08] cursor-pointer">
          Después
        </button>
      </div>
    </div>
  );
}
