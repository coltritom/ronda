/* Skeleton de carga para /groups — se muestra durante la navegación a la ruta */

function SkeletonGroupCard() {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-noche-media p-4 animate-pulse">
      {/* Avatar */}
      <div className="h-12 w-12 flex-shrink-0 rounded-2xl bg-niebla/20" />

      {/* Info */}
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-36 rounded-md bg-niebla/20" />
          <div className="h-4 w-12 rounded-full bg-niebla/20" />
        </div>
        <div className="h-3.5 w-52 rounded bg-niebla/20" />
        <div className="h-3 w-20 rounded bg-niebla/20" />
      </div>

      {/* Chevron */}
      <div className="h-4 w-4 flex-shrink-0 rounded bg-niebla/20" />
    </div>
  )
}

export default function GroupsLoading() {
  return (
    <div className="p-5 lg:p-8 max-w-2xl">

      {/* Header skeleton */}
      <div className="mb-6 flex items-center justify-between gap-4 animate-pulse">
        <div className="space-y-2">
          <div className="h-8 w-36 rounded-lg bg-niebla/20" />
          <div className="h-4 w-24 rounded bg-niebla/20" />
        </div>
        <div className="h-9 w-32 rounded-xl bg-niebla/20" />
      </div>

      {/* Cards skeleton */}
      <div className="flex flex-col gap-3">
        <SkeletonGroupCard />
        <SkeletonGroupCard />
        <SkeletonGroupCard />
      </div>
    </div>
  )
}
