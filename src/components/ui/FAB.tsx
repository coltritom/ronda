import { Plus } from "lucide-react";

interface FABProps {
  onClick?: () => void;
  label?: string;
  className?: string;
}

export function FAB({ onClick, label = "Crear", className = "" }: FABProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`
        fixed bottom-24 right-5 md:hidden z-40
        w-14 h-14 rounded-full bg-fuego text-white
        flex items-center justify-center
        shadow-[0_6px_24px_rgba(232,93,58,0.35)]
        cursor-pointer border-none
        active:scale-95 transition-transform
        ${className}
      `}
    >
      <Plus size={24} strokeWidth={2.5} />
    </button>
  );
}
