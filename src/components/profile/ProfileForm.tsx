'use client'

import { useState, useTransition } from 'react'
import { updateProfile } from '@/lib/actions/profile'

export function ProfileForm({ initialName }: { initialName: string }) {
  const [name, setName]       = useState(initialName)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [pending, startSave]  = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    startSave(async () => {
      const result = await updateProfile(name)
      if (result?.error) {
        setError(result.error)
      } else {
        setSaved(true)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground" htmlFor="profile-name">
          Nombre
        </label>
        <input
          id="profile-name"
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setSaved(false) }}
          required
          maxLength={80}
          className="w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending || !name.trim()}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {pending ? 'Guardando…' : 'Guardar cambios'}
        </button>
        {saved && <span className="text-sm text-green-500">✓ Guardado</span>}
      </div>
    </form>
  )
}
