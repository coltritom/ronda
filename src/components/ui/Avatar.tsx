import { getMemberColor } from "@/lib/constants";

interface AvatarProps {
  emoji?: string;
  name: string;
  src?: string | null;
  colorIndex?: number;
  size?: "sm" | "md" | "lg";
  selected?: boolean;
  className?: string;
}

const SIZES = {
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-lg",
  lg: "w-20 h-20 text-4xl",
};

const COLOR_BG: Record<string, string> = {
  fuego: "bg-fuego/20",
  uva: "bg-uva/20",
  menta: "bg-menta/20",
  ambar: "bg-ambar/20",
  rosa: "bg-rosa/20",
};

export function Avatar({ emoji, name, src, colorIndex = 0, size = "md", selected = false, className = "" }: AvatarProps) {
  const color = getMemberColor(colorIndex);
  return (
    <div
      className={`
        rounded-full flex items-center justify-center shrink-0 transition-all overflow-hidden
        ${SIZES[size]}
        ${!src ? (COLOR_BG[color] || "bg-fuego/20") : ""}
        ${selected ? "ring-[2.5px] ring-fuego" : "ring-2 ring-transparent"}
        ${className}
      `}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : emoji ? (
        <span>{emoji}</span>
      ) : (
        <span className="font-semibold text-humo">
          {name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}

interface AvatarStackProps {
  members: { emoji?: string; name: string; colorIndex?: number }[];
  max?: number;
}

export function AvatarStack({ members, max = 5 }: AvatarStackProps) {
  const visible = members.slice(0, max);
  const extra = members.length - max;

  return (
    <div className="flex items-center">
      {visible.map((m, i) => (
        <div key={i} className={i > 0 ? "-ml-2" : ""} style={{ zIndex: max - i }}>
          <Avatar emoji={m.emoji} name={m.name} colorIndex={m.colorIndex} size="sm" />
        </div>
      ))}
      {extra > 0 && (
        <div className="-ml-2 w-8 h-8 rounded-full bg-noche-media border-2 border-noche flex items-center justify-center text-[11px] font-semibold text-niebla">
          +{extra}
        </div>
      )}
    </div>
  );
}
