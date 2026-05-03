import Link from 'next/link'

interface Tab {
  id:     string
  label:  string
  count?: number
  alert?: boolean
}

interface EventTabsProps {
  tabs:      Tab[]
  activeTab: string
  groupId:   string
  eventId:   string
}

export function EventTabs({ tabs, activeTab, groupId, eventId }: EventTabsProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        const href = `/groups/${groupId}/events/${eventId}?tab=${tab.id}`

        return (
          <Link
            key={tab.id}
            href={href}
            className={`
              px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-all
              ${isActive
                ? 'bg-fuego/[0.12] text-fuego ring-1 ring-fuego/30'
                : 'bg-white/5 text-niebla'
              }
            `}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1.5 text-[11px]">{tab.count}</span>
            )}
            {tab.alert && (
              <span className="ml-1.5 inline-block h-2 w-2 rounded-full bg-alerta align-middle" />
            )}
          </Link>
        )
      })}
    </div>
  )
}
