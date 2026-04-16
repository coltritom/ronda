/* Skeleton de carga para /home — se muestra durante la navegación a la ruta */

function SkeletonSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 md:px-6 mb-3 animate-pulse">
      {children}
    </div>
  )
}

export default function HomeLoading() {
  return (
    <div className="max-w-2xl mx-auto pb-8">

      {/* PersonalSummary skeleton */}
      <div className="px-4 md:px-6 pt-5 pb-1 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-2">
            <div className="h-7 w-32 rounded-lg bg-white/10" />
            <div className="h-4 w-44 rounded bg-white/10" />
          </div>
          {/* Avatar */}
          <div className="h-11 w-11 rounded-full bg-white/10" />
        </div>

        {/* Stats rápidos */}
        <div className="flex gap-2 mb-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1 bg-noche-media rounded-[14px] py-3 px-3.5 text-center">
              <div className="h-7 w-14 rounded-md bg-white/10 mx-auto" />
              <div className="h-3 w-10 rounded bg-white/10 mx-auto mt-2" />
            </div>
          ))}
        </div>
      </div>

      {/* PendingDebts skeleton */}
      <SkeletonSection>
        <div className="bg-noche-media rounded-2xl p-3.5 border-l-[3px] border-alerta/30">
          <div className="flex justify-between items-center">
            <div className="space-y-1.5">
              <div className="h-4 w-40 rounded bg-white/10" />
              <div className="h-3 w-52 rounded bg-white/10" />
            </div>
            <div className="h-4 w-10 rounded bg-white/10" />
          </div>
          <div className="mt-2.5 flex flex-col gap-1.5">
            {[1, 2].map((i) => (
              <div key={i} className="flex justify-between px-2 py-1.5 rounded-[10px] bg-noche">
                <div className="h-3 w-36 rounded bg-white/10" />
                <div className="h-3 w-16 rounded bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      </SkeletonSection>

      {/* UpcomingJuntadas skeleton */}
      <SkeletonSection>
        <div className="h-4 w-36 rounded bg-white/10 mb-2" />
        <div className="flex flex-col gap-2">
          {[1, 2].map((i) => (
            <div key={i} className="bg-noche-media rounded-2xl p-3.5">
              <div className="space-y-1.5 mb-2">
                <div className="h-3 w-28 rounded bg-white/10" />
                <div className="h-4 w-48 rounded bg-white/10" />
                <div className="h-3 w-40 rounded bg-white/10" />
              </div>
              {/* RSVP buttons */}
              <div className="flex gap-1.5 mt-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex-1 h-8 rounded-full bg-white/5" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </SkeletonSection>

      {/* RecentActivity skeleton */}
      <SkeletonSection>
        <div className="h-4 w-36 rounded bg-white/10 mb-2" />
        <div className="bg-noche-media rounded-2xl py-1">
          {[1, 2, 3, 4].map((i, idx) => (
            <div
              key={i}
              className={`flex gap-2.5 px-3.5 py-2.5 ${idx > 0 ? 'border-t border-white/[0.04]' : ''}`}
            >
              <div className="h-5 w-5 rounded-full bg-white/10 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-4/5 rounded bg-white/10" />
                <div className="h-3 w-1/2 rounded bg-white/10" />
              </div>
              <div className="h-3 w-10 rounded bg-white/10 shrink-0 mt-0.5" />
            </div>
          ))}
        </div>
      </SkeletonSection>

      {/* MyGroups skeleton */}
      <SkeletonSection>
        <div className="flex justify-between items-center mb-2">
          <div className="h-4 w-24 rounded bg-white/10" />
          <div className="h-4 w-14 rounded bg-white/10" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1 bg-noche-media rounded-[14px] py-3.5 px-2.5">
              <div className="h-8 w-8 rounded-full bg-white/10 mx-auto" />
              <div className="h-3 w-3/4 rounded bg-white/10 mx-auto mt-2" />
            </div>
          ))}
        </div>
      </SkeletonSection>

    </div>
  )
}
