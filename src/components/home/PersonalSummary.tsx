import { Avatar } from "@/components/ui/Avatar";

const STATS = [
  { value: "$3.600", label: "Debés" },
  { value: "$1.200", label: "Te deben" },
  { value: "6/8", label: "Asistencia" },
];

export function PersonalSummary() {
  return (
    <div className="px-4 md:px-6 pt-5 pb-1">
      {/* Saludo */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display font-bold text-[22px] text-carbon dark:text-humo m-0">
            Hola, Tomi
          </h1>
          <p className="text-[13px] text-gris-cal dark:text-niebla mt-0.5">
            Así venís esta semana
          </p>
        </div>
        <Avatar emoji="🙋‍♂️" name="Tomi" colorIndex={1} size="md" selected />
      </div>

      {/* Stats rápidos */}
      <div className="flex gap-2 mb-3">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="flex-1 bg-noche-media dark:bg-noche-media bg-crema rounded-[14px] py-3 px-3.5 text-center"
          >
            <p className="font-display font-bold text-xl text-carbon dark:text-humo m-0">
              {s.value}
            </p>
            <p className="text-[11px] text-gris-cal dark:text-niebla mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
