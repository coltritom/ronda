"use client";

interface InnerTabsProps {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
}

export function InnerTabs({ tabs, active, onChange }: InnerTabsProps) {
  return (
    <div className="flex gap-5 border-b border-white/[0.06] px-4 md:px-6 overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`
            bg-transparent border-none cursor-pointer py-2.5 text-sm font-semibold
            whitespace-nowrap transition-all
            ${active === t
              ? "text-humo border-b-2 border-fuego"
              : "text-niebla border-b-2 border-transparent"
            }
          `}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
