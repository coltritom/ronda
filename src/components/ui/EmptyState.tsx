import { Button } from "./Button";

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction, secondaryLabel, onSecondary }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-16">
      <div className="relative w-20 h-20 mb-6">
        <div className="absolute inset-0 rounded-full border border-niebla/20" />
        <div className="absolute inset-2 rounded-full border border-niebla/15" />
        <div className="absolute inset-4 rounded-full border border-niebla/10" />
        <div className="absolute inset-[30%] rounded-full bg-fuego/10" />
      </div>

      <p className="font-semibold text-base text-humo mb-1">{title}</p>
      {description && (
        <p className="text-sm text-niebla mb-6 max-w-[280px]">{description}</p>
      )}

      {actionLabel && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
      {secondaryLabel && (
        <button
          onClick={onSecondary}
          className="mt-3 text-sm font-semibold text-fuego bg-transparent border-none cursor-pointer"
        >
          {secondaryLabel}
        </button>
      )}
    </div>
  );
}
