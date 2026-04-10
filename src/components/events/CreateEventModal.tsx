'use client'

/*
  Botón + modal para crear una juntada dentro de un grupo.
  Usa una Server Action para el INSERT.
*/
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createEvent } from '@/lib/actions/events'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface CreateEventModalProps {
  groupId: string
}

export function CreateEventModal({ groupId }: CreateEventModalProps) {
  const router = useRouter()
  const [open, setOpen]               = useState(false)
  const [name, setName]               = useState('')
  const [dateTime, setDateTime]       = useState('')
  const [location, setLocation]       = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)

  function handleClose() {
    if (loading) return
    setOpen(false)
    setName('')
    setDateTime('')
    setLocation('')
    setDescription('')
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    /* Interpretar la fecha como hora argentina (UTC-3) */
    const dateWithTz = dateTime + ':00-03:00'

    const result = await createEvent(
      groupId,
      name.trim(),
      dateWithTz,
      location.trim() || null,
      description.trim() || null
    )

    if ('error' in result) {
      setError(result.error)
      setLoading(false)
      return
    }

    setLoading(false)
    handleClose()
    router.refresh()
    router.push(`/groups/${groupId}/events/${result.eventId}`)
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Nueva juntada
      </Button>

      <Modal open={open} onClose={handleClose} title="Crear juntada">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          <Input
            label="¿Cómo se llama la juntada?"
            type="text"
            placeholder="Ej: Asado del sábado"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            maxLength={80}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="event-date">
              Fecha y hora
            </label>
            <input
              id="event-date"
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              required
              className="
                w-full rounded-lg border border-border bg-surface-2
                px-3.5 py-2.5 text-sm text-foreground
                focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                transition-colors
                [color-scheme:dark]
              "
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
            <label className="text-sm font-medium text-foreground">
              Descripción{' '}
              <span className="font-normal text-muted">(opcional)</span>
            </label>
            <textarea
              placeholder="Detalles, qué llevar, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={300}
              rows={2}
              className="
                w-full resize-none rounded-lg border border-border bg-surface-2
                px-3.5 py-2.5 text-sm text-foreground
                placeholder:text-muted
                focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                transition-colors
              "
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3.5 py-2.5">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={handleClose} className="flex-1" disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading} className="flex-1" disabled={!name.trim() || !dateTime}>
              Crear juntada
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
