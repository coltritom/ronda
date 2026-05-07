'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MoreVertical } from 'lucide-react'
import { updateEvent, deleteEvent } from '@/lib/actions/events'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface EventOptionsMenuProps {
  eventId: string
  groupId: string
  initialName: string
  initialDate: string
  initialLocation: string | null
  initialDescription: string | null
}

function utcToArgDateTimeLocal(isoString: string): string {
  const d = new Date(isoString)
  const argTime = new Date(d.getTime() - 3 * 60 * 60 * 1000)
  return argTime.toISOString().slice(0, 16)
}

export function EventOptionsMenu({
  eventId,
  groupId,
  initialName,
  initialDate,
  initialLocation,
  initialDescription,
}: EventOptionsMenuProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen]   = useState(false)
  const [editOpen, setEditOpen]   = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const [name, setName]               = useState(initialName)
  const [dateTime, setDateTime]       = useState(() => utcToArgDateTimeLocal(initialDate))
  const [location, setLocation]       = useState(initialLocation ?? '')
  const [description, setDescription] = useState(initialDescription ?? '')

  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  function openEdit() {
    setMenuOpen(false)
    setName(initialName)
    setDateTime(utcToArgDateTimeLocal(initialDate))
    setLocation(initialLocation ?? '')
    setDescription(initialDescription ?? '')
    setError(null)
    setEditOpen(true)
  }

  function openDelete() {
    setMenuOpen(false)
    setError(null)
    setDeleteOpen(true)
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await updateEvent(
      eventId,
      name.trim(),
      dateTime + ':00-03:00',
      location.trim() || null,
      description.trim() || null
    )

    if (result && 'error' in result) {
      setError(result.error)
      setLoading(false)
      return
    }

    setLoading(false)
    setEditOpen(false)
    router.refresh()
  }

  async function handleDelete() {
    setLoading(true)
    setError(null)

    const result = await deleteEvent(eventId)

    if ('error' in result) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.push(`/groups/${groupId}`)
  }

  return (
    <>
      <div ref={menuRef} className="relative">
        <button
          onClick={() => setMenuOpen(v => !v)}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-niebla hover:text-humo hover:bg-noche-media transition-colors"
          aria-label="Opciones de juntada"
        >
          <MoreVertical size={18} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 z-50 min-w-[170px] rounded-xl border border-white/10 bg-noche-media shadow-xl overflow-hidden">
            <button
              onClick={openEdit}
              className="w-full px-4 py-2.5 text-left text-sm text-humo hover:bg-white/5 transition-colors"
            >
              Editar juntada
            </button>
            <button
              onClick={openDelete}
              className="w-full px-4 py-2.5 text-left text-sm text-error hover:bg-white/5 transition-colors"
            >
              Eliminar juntada
            </button>
          </div>
        )}
      </div>

      {/* Edit modal */}
      <Modal open={editOpen} onClose={() => { if (!loading) setEditOpen(false) }} title="Editar juntada">
        <form onSubmit={handleUpdate} className="flex flex-col gap-4">
          <Input
            label="Nombre"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            maxLength={80}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-humo" htmlFor="edit-event-date">
              Fecha y hora
            </label>
            <input
              id="edit-event-date"
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              required
              className="w-full rounded-lg border border-niebla/20 bg-noche px-3.5 py-2.5 text-sm text-humo focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors [color-scheme:dark]"
            />
          </div>

          <Input
            label="Lugar"
            type="text"
            placeholder="Ej: Casa de Ramiro"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            maxLength={100}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-humo">
              Descripción{' '}
              <span className="font-normal text-niebla">(opcional)</span>
            </label>
            <textarea
              placeholder="Detalles, qué llevar, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={300}
              rows={2}
              className="w-full resize-none rounded-lg border border-niebla/20 bg-noche px-3.5 py-2.5 text-sm text-humo placeholder:text-niebla focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3.5 py-2.5">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={() => setEditOpen(false)} className="flex-1" disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading} className="flex-1" disabled={!name.trim() || !dateTime}>
              Guardar cambios
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm modal */}
      <Modal open={deleteOpen} onClose={() => { if (!loading) setDeleteOpen(false) }} title="Eliminar juntada">
        <div className="flex flex-col gap-5">
          <p className="text-sm text-niebla leading-relaxed">
            ¿Estás seguro que querés eliminar esta juntada? Se borrarán también todos los gastos, aportes y RSVPs asociados. Esta acción no se puede deshacer.
          </p>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3.5 py-2.5">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setDeleteOpen(false)} className="flex-1" disabled={loading}>
              Cancelar
            </Button>
            <Button type="button" variant="danger" onClick={handleDelete} loading={loading} className="flex-1">
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
