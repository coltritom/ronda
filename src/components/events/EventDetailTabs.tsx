'use client'

import { useState } from 'react'
import { RsvpButtons }          from '@/components/events/RsvpButtons'
import { AttendanceSection }    from '@/components/events/AttendanceSection'
import { GuestSection }         from '@/components/events/GuestSection'
import { ContributionsSection } from '@/components/events/ContributionsSection'
import { ExpensesSection }      from '@/components/events/ExpensesSection'
import { CuentasSection }       from '@/components/events/CuentasSection'
import type { AporteId } from '@/lib/constants'

type RsvpStatus = 'going' | 'maybe' | 'not_going'

interface RsvpEnriched {
  response: RsvpStatus
  user_id:  string
  profiles: { name: string }
}

interface ContributionEnriched {
  id:          string
  category:    AporteId
  description: string | null
  quantity:    number
  user_id:     string | null
  guest_name:  string | null
  profiles:    { name: string }
}

interface ExpenseSplitEnriched {
  user_id:    string | null
  guest_name: string | null
  amount:     number
  is_settled: boolean
  profiles:   { name: string }
}

interface ExpenseEnriched {
  id:                  string
  description:         string | null
  amount:              number
  paid_by:             string | null
  paid_by_guest_name:  string | null
  split_type:          string | null
  profiles:            { name: string }
  expense_splits:      ExpenseSplitEnriched[]
}

interface Tab {
  id:     string
  label:  string
  count?: number
  alert?: boolean
}

interface Props {
  tabs:            Tab[]
  defaultTab:      string
  isPast:          boolean
  eventId:         string
  groupId:         string
  currentUserId:   string
  currentUserName: string
  canAdd:          boolean
  myRsvp:              RsvpStatus | null
  rsvps:               RsvpEnriched[]
  myAttendance:        boolean | null
  suggestedAttendance: boolean | null
  attendees:           { user_id: string; name: string }[]
  guests:          { id: string; name: string }[]
  members:         { user_id: string; name: string }[]
  contributions:   ContributionEnriched[]
  expenses:        ExpenseEnriched[]
  settlements:     { from_user: string; to_user: string; amount: number }[]
}

export function EventDetailTabs({
  tabs, defaultTab, isPast,
  eventId, groupId, currentUserId, currentUserName, canAdd,
  myRsvp, rsvps, myAttendance, suggestedAttendance, attendees, guests, members,
  contributions, expenses, settlements,
}: Props) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  const going    = rsvps.filter((r) => r.response === 'going')
  const maybe    = rsvps.filter((r) => r.response === 'maybe')
  const notGoing = rsvps.filter((r) => r.response === 'not_going')

  return (
    <>
      {/* Tab bar */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-all border-none cursor-pointer
                ${isActive
                  ? 'bg-fuego/[0.12] text-fuego ring-1 ring-fuego/30'
                  : 'bg-white/5 text-niebla'}
              `}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1.5 text-[11px]">{tab.count}</span>
              )}
              {tab.alert && (
                <span className="ml-1.5 inline-block h-2 w-2 rounded-full bg-alerta align-middle" />
              )}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="flex flex-col gap-4 mt-4">

        {activeTab === 'asistencia' && (
          <div className="flex flex-col gap-4">
            {!isPast && (
              <>
                <RsvpButtons eventId={eventId} currentStatus={myRsvp} />
                <GuestSection eventId={eventId} initialGuests={guests} />
              </>
            )}
            {isPast && (
              <AttendanceSection
                eventId={eventId}
                currentUserId={currentUserId}
                myAttendance={myAttendance}
                suggestedAttendance={suggestedAttendance}
                attendees={attendees}
                guests={guests}
              />
            )}
            <div className="flex flex-col gap-4">
              {[
                { label: isPast ? 'Fueron'          : 'Van',     list: going,    color: 'text-menta' },
                { label: isPast ? 'No respondieron' : 'Tal vez', list: maybe,    color: 'text-niebla' },
                { label: isPast ? 'No fueron'       : 'No van',  list: notGoing, color: 'text-error' },
              ]
                .filter(({ list }) => list.length > 0)
                .map(({ label, list, color }) => (
                  <div key={label}>
                    <p className={`mb-2 text-xs font-semibold uppercase tracking-wider ${color}`}>
                      {label} ({list.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {list.map((rsvp) => (
                        <div
                          key={rsvp.user_id}
                          className="flex items-center gap-2 rounded-full bg-noche-media px-3 py-1.5"
                        >
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-fuego/20 text-[10px] font-bold text-fuego">
                            {(rsvp.profiles?.name ?? '?').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-humo">
                            {rsvp.profiles?.name ?? 'Usuario'}
                            {rsvp.user_id === currentUserId && (
                              <span className="ml-1 text-xs text-niebla">(vos)</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              {rsvps.length === 0 && !isPast && (
                <p className="text-sm text-niebla">Nadie confirmó todavía. ¡Sé el primero!</p>
              )}
              {rsvps.length === 0 && isPast && (
                <p className="text-sm text-niebla">Nadie había confirmado asistencia.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'aportes' && (
          <ContributionsSection
            eventId={eventId}
            currentUserId={currentUserId}
            contributions={contributions}
            canAdd={canAdd}
            guests={guests}
          />
        )}

        {activeTab === 'gastos' && (
          <ExpensesSection
            groupId={groupId}
            eventId={eventId}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            expenses={expenses}
            attendees={members}
            settlements={settlements}
            guests={guests}
          />
        )}

        {activeTab === 'cuentas' && (
          <CuentasSection
            groupId={groupId}
            eventId={eventId}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            expenses={expenses}
            attendees={members}
            settlements={settlements}
          />
        )}

      </div>
    </>
  )
}
