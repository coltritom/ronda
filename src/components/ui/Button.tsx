interface ButtonProps {
  children: React.ReactNode;
  primary?: boolean;
  big?: boolean;
  full?: boolean;
  fullWidth?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
}

export function Button({
  children,
  primary = true,
  big = false,
  full = false,
  fullWidth = false,
  onClick,
  type = "button",
  loading = false,
  disabled = false,
  className = "",
  variant,
  size,
}: ButtonProps) {
  // variant/size override primary/big when provided
  const isPrimary = variant ? variant === "primary" : primary;
  const isGhost = variant === "ghost";
  const isDanger = variant === "danger";
  const isBig = size === "lg" ? true : size === "sm" ? false : big;
  const isFullWidth = full || fullWidth;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 font-body font-semibold cursor-pointer
        transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
        ${isBig ? "px-8 py-4 text-base" : "px-6 py-3 text-[15px]"}
        ${isFullWidth ? "w-full" : ""}
        ${isDanger
          ? "bg-error text-white border-none rounded-xl hover:opacity-90"
          : isGhost
          ? "bg-transparent text-humo border-none rounded-xl hover:bg-white/5"
          : isPrimary
          ? "bg-fuego text-white border-none rounded-xl hover:opacity-90"
          : "bg-transparent text-fuego border-[1.5px] border-fuego rounded-xl hover:bg-fuego/5"
        }
        ${className}
      `}
    >
      {loading ? "Cargando…" : children}
    </button>
  );
}
