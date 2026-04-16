'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { createGroup } from '@/lib/actions/groups'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function CreateGroupModal() {
  const router = useRouter()
  const [open, setOpen]               = useState(false)
  const [name, setName]               = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)

  function handleClose() {
    if (loading) return
    setOpen(false)
    setName('')
    setDescription('')
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await createGroup(name.trim(), description.trim() || null)

    if ('error' in result) {
      setError(result.error)
      setLoading(false)
      return
    }

    setLoading(false)
    handleClose()
    router.refresh()
    router.push(`/groups/${result.groupId}`)
  }

  return (
    <>
      {/* Botón desktop — en el header de la página */}
      <Button onClick={() => setOpen(true)} size="sm" className="hidden sm:inline-flex gap-2">
        <Plus size={16} />
        Nuevo grupo
      </Button>

      {/* FAB mobile — flotante sobre el TabBar */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Crear grupo"
        className="sm:hidden fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-fuego text-white shadow-lg shadow-fuego/30 hover:bg-fuego/90 active:scale-95 transition-all"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      <Modal open={open} onClose={handleClose} title="Crear grupo">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Nombre del grupo"
            type="text"
            placeholder="Ej: Los del barrio"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            maxLength={60}
          />

          <div className="flex flex-col gap-1.5">
            <label className="font-body text-sm font-medium text-foreground">
              Descripción{' '}
              <span className="font-normal text-muted">(opcional)</span>
            </label>
            <textarea
              placeholder="¿De qué va el grupo?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              rows={2}
              className="w-full resize-none rounded-[10px] border-[1.5px] border-border bg-surface-2 px-3.5 py-2.5 font-body text-[15px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-error/10 border border-error/20 px-3.5 py-2.5">
              <p className="font-body text-sm text-error">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={handleClose} fullWidth disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading} fullWidth disabled={!name.trim()}>
              Crear grupo
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
