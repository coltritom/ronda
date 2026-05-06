import { fmtARS as _fmtARS } from "@/lib/utils";

export type ActivityType = "event_created" | "member_joined";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  actorName: string;
  groupName: string;
  eventName?: string;
  eventDate?: string;
  createdAt: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  if (hours < 24) return `hace ${hours}h`;
  if (days < 7) return `hace ${days}d`;
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(iso));
}

export function RecentActivity({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="px-4 md:px-6 mb-3">
      <p className="font-display font-semibold text-[15px] text-carbon dark:text-humo mb-2">
        Actividad reciente
      </p>

      <div className="bg-noche-media dark:bg-noche-media bg-crema rounded-2xl py-1">
        {items.map((item, i) => {
          const title =
            item.type === "event_created"
              ? `${item.actorName} creó una juntada en ${item.groupName}`
              : `${item.actorName} se unió a ${item.groupName}`;
          const subtitle =
            item.type === "event_created" && item.eventName
              ? `${item.eventName} — ${item.eventDate}`
              : undefined;

          return (
            <div
              key={item.id}
              className={`
                flex gap-2.5 px-3.5 py-2.5
                ${i > 0 ? "border-t border-white/[0.04] dark:border-white/[0.04] border-black/[0.04]" : ""}
              `}
            >
              <span className="text-base mt-0.5 shrink-0">
                {item.type === "event_created" ? "📅" : "👋"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-carbon dark:text-humo m-0 leading-snug">{title}</p>
                {subtitle && (
                  <p className="text-[11px] text-gris-cal dark:text-niebla mt-0.5">{subtitle}</p>
                )}
              </div>
              <span className="text-[10px] text-gris-cal/50 dark:text-niebla/50 whitespace-nowrap shrink-0 mt-0.5">
                {timeAgo(item.createdAt)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
