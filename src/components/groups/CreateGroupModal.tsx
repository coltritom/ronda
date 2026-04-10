'use client'

/*
  Botón + modal para crear un grupo.
  Usa una Server Action para el INSERT, lo que evita problemas
  de sesión con el browser Supabase client.
*/
import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
      <Button onClick={() => setOpen(true)} className="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Nuevo grupo
      </Button>

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
            <label className="text-sm font-medium text-foreground">
              Descripción{' '}
              <span className="font-normal text-muted">(opcional)</span>
            </label>
            <textarea
              placeholder="¿De qué va el grupo?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
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
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={loading}
              className="flex-1"
              disabled={!name.trim()}
            >
              Crear grupo
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
