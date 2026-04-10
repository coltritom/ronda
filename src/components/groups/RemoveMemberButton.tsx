'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { removeMember } from '@/lib/actions/groups'

interface Props {
  groupId: string
  userId: string
  name: string
  isSelf: boolean
}

export function RemoveMemberButton({ groupId, userId, name, isSelf }: Props) {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleRemove() {
    setError(null)
    startTransition(async () => {
      const result = await removeMember(groupId, userId)
      if (result?.error) {
        setError(result.error)
        setConfirm(false)
      } else {
        router.refresh()
      }
    })
  }

  if (!confirm) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          onClick={() => setConfirm(true)}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:border-red-500/40 hover:text-red-500 transition-colors"
        >
          {isSelf ? 'Salir' : 'Remover'}
        </button>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted">
        {isSelf ? '¿Salir del grupo?' : `¿Remover a ${name}?`}
      </span>
      <button
        onClick={() => setConfirm(false)}
        disabled={pending}
        className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted hover:text-foreground transition-colors disabled:opacity-50"
      >
        No
      </button>
      <button
        onClick={handleRemove}
        disabled={pending}
        className="rounded-lg bg-red-500/10 border border-red-500/30 px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-500/20 transition-colors disabled:opacity-50"
      >
        {pending ? '...' : 'Sí'}
      </button>
    </div>
  )
}
