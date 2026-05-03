'use client'

import { CreateGroupModal } from './CreateGroupModal'

export function GroupsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-niebla/20 bg-noche-media py-16 px-6 text-center">

      {/* Anillos decorativos */}
      <div className="relative mb-6 h-20 w-20">
        <div className="absolute inset-0 rounded-full border border-fuego/20" />
        <div className="absolute inset-2 rounded-full border border-fuego/15" />
        <div className="absolute inset-4 rounded-full border border-fuego/10" />
        <div className="absolute inset-[30%] rounded-full bg-fuego/15" />
        <div className="absolute inset-0 flex items-center justify-center text-2xl">
          🔥
        </div>
      </div>

      <h2 className="font-heading text-lg font-semibold text-humo">
        Todavía no tenés grupos
      </h2>
      <p className="mt-2 max-w-[260px] font-body text-sm leading-relaxed text-niebla">
        Creá un grupo, mandá el link a tus amigos y empezá a registrar juntadas, gastos y quién siempre llega tarde.
      </p>

      <div className="mt-6">
        <CreateGroupModal />
      </div>
    </div>
  )
}
