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
    <nav className="-mb-px flex gap-1 overflow-x-auto border-b border-noche bg-noche-media px-5 lg:px-8">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        const href = `/groups/${groupId}/events/${eventId}?tab=${tab.id}`

        return (
          <Link
            key={tab.id}
            href={href}
            className={`
              flex flex-shrink-0 items-center gap-1.5 border-b-2 px-3 pb-3 pt-3
              font-body text-sm font-medium transition-colors whitespace-nowrap
              ${isActive
                ? 'border-fuego text-fuego'
                : 'border-transparent text-niebla hover:text-humo'
              }
            `}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 font-body text-xs font-semibold ${
                isActive ? 'bg-fuego/10 text-fuego' : 'bg-noche text-niebla'
              }`}>
                {tab.count}
              </span>
            )}
            {tab.alert && (
              <span className="h-2 w-2 rounded-full bg-alerta" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
