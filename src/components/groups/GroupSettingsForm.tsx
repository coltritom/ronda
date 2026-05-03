'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateGroup, deleteGroup } from '@/lib/actions/groups'

interface Props {
  groupId: string
  initialName: string
  initialDescription: string
}

export function GroupSettingsForm({ groupId, initialName, initialDescription }: Props) {
  const router = useRouter()
  const [name, setName]               = useState(initialName)
  const [description, setDescription] = useState(initialDescription)
  const [saveError, setSaveError]     = useState<string | null>(null)
  const [saved, setSaved]             = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const [savePending, startSave]     = useTransition()
  const [deletePending, startDelete] = useTransition()

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaveError(null)
    setSaved(false)
    startSave(async () => {
      const result = await updateGroup(groupId, name.trim(), description.trim() || null)
      if (result?.error) {
        setSaveError(result.error)
      } else {
        setSaved(true)
        router.refresh()
      }
    })
  }

  function handleDelete() {
    setDeleteError(null)
    startDelete(async () => {
      const result = await deleteGroup(groupId)
      if (result?.error) {
        setDeleteError(result.error)
        setDeleteConfirm(false)
      }
      /* Si no hay error, deleteGroup hace redirect a /groups */
    })
  }

  return (
    <div className="flex flex-col gap-10">

      {/* ── Editar nombre y descripción ─────────────────────────── */}
      <form onSubmit={handleSave} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-humo" htmlFor="group-name">
            Nombre del grupo
          </label>
          <input
            id="group-name"
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setSaved(false) }}
            required
            maxLength={80}
            className="w-full rounded-lg border border-niebla/20 bg-noche px-3.5 py-2.5 text-sm text-humo placeholder:text-niebla focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-humo" htmlFor="group-desc">
            Descripción{' '}
            <span className="font-normal text-niebla">(opcional)</span>
          </label>
          <textarea
            id="group-desc"
            value={description}
            onChange={(e) => { setDescription(e.target.value); setSaved(false) }}
            maxLength={300}
            rows={3}
            className="w-full resize-none rounded-lg border border-niebla/20 bg-noche px-3.5 py-2.5 text-sm text-humo placeholder:text-niebla focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
          />
        </div>

        {saveError && (
          <p className="text-sm text-red-500">{saveError}</p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={savePending || !name.trim()}
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {savePending ? 'Guardando…' : 'Guardar cambios'}
          </button>
          {saved && (
            <span className="text-sm text-green-500">✓ Guardado</span>
          )}
        </div>
      </form>

      {/* ── Zona de peligro ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
        <h3 className="mb-1 text-sm font-semibold text-red-500">
          Zona de peligro
        </h3>
        <p className="mb-4 text-sm text-niebla">
          Eliminar el grupo borra todas las juntadas, aportes y gastos asociados. Esta acción no se puede deshacer.
        </p>

        {!deleteConfirm ? (
          <button
            onClick={() => setDeleteConfirm(true)}
            className="rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
          >
            Eliminar grupo
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-humo">
              ¿Seguro? No hay vuelta atrás.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirm(false)}
                disabled={deletePending}
                className="rounded-lg border border-niebla/20 px-4 py-2 text-sm text-niebla hover:text-humo transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deletePending}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deletePending ? 'Eliminando…' : 'Sí, eliminar'}
              </button>
            </div>
            {deleteError && (
              <p className="text-sm text-red-500">{deleteError}</p>
            )}
          </div>
        )}
      </div>

    </div>
  )
}
