interface PillProps {
  children: React.ReactNode;
  color?: string;
}

export function Pill({ children, color = "fuego" }: PillProps) {
  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    fuego: { bg: "bg-fuego/[0.12]", border: "border-fuego/25", text: "text-fuego" },
    ambar: { bg: "bg-ambar/[0.12]", border: "border-ambar/25", text: "text-ambar" },
    menta: { bg: "bg-menta/[0.12]", border: "border-menta/25", text: "text-menta" },
    uva:   { bg: "bg-uva/[0.12]",   border: "border-uva/25",   text: "text-uva" },
    rosa:  { bg: "bg-rosa/[0.12]",  border: "border-rosa/25",  text: "text-rosa" },
  };

  const c = colorMap[color] || colorMap.fuego;

  return (
    <span className={`
      inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full
      text-[13px] font-semibold font-body border
      ${c.bg} ${c.border} ${c.text}
    `}>
      {children}
    </span>
  );
}
