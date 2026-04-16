import { Pill } from "@/components/ui/Pill";

const MY_BADGES = [
  { emoji: "🏆", label: "Invicto", group: "Los del asado", color: "ambar" as const },
  { emoji: "👻", label: "Fantasma", group: "Fútbol 5", color: "uva" as const },
  { emoji: "💰", label: "La billetera", group: "Depto vac.", color: "ambar" as const },
];

export function MyBadges() {
  if (MY_BADGES.length === 0) return null;

  return (
    <div className="px-4 md:px-6 mb-3">
      <p className="font-display font-semibold text-[15px] text-carbon dark:text-humo mb-2">
        Tus etiquetas
      </p>

      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 md:-mx-6 md:px-6">
        {MY_BADGES.map((b, i) => (
          <Pill key={i} color={b.color}>
            {b.emoji} {b.label} — {b.group}
          </Pill>
        ))}
      </div>
    </div>
  );
}
