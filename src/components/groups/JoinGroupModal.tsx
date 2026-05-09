'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Link2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

function extractToken(input: string): string | null {
  const trimmed = input.trim()
  try {
    const url = new URL(trimmed)
    const match = url.pathname.match(/\/invite\/([^/?#]+)/)
    if (match) return match[1]
  } catch {}
  if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) return trimmed
  return null
}

export function JoinGroupModal({ variant = 'button' }: { variant?: 'button' | 'link' }) {
  const router = useRouter()
  const [open, setOpen]   = useState(false)
  const [link, setLink]   = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleClose() {
    setOpen(false)
    setLink('')
    setError(null)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const token = extractToken(link)
    if (!token) {
      setError('Link inválido. Pedile al admin que te mande uno nuevo.')
      return
    }
    router.push(`/invite/${token}`)
  }

  return (
    <>
      {variant === 'button' ? (
        <button
          onClick={() => setOpen(true)}
          aria-label="Unirse con link"
          className="flex items-center gap-1.5 h-9 px-2.5 sm:px-3.5 rounded-xl border-[1.5px] border-fuego text-fuego font-body text-sm font-semibold hover:bg-fuego/5 transition-colors active:scale-95"
        >
          <Link2 size={15} strokeWidth={2.5} />
          <span className="hidden sm:inline">Unirse con link</span>
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="text-sm text-fuego font-semibold bg-transparent border-none cursor-pointer p-0"
        >
          Tengo un link de invitación
        </button>
      )}

      <Modal open={open} onClose={handleClose} title="Unirse a un grupo">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Link de invitación"
            type="text"
            placeholder="https://ronda.app/invite/abc123"
            value={link}
            onChange={(e) => { setLink(e.target.value); setError(null) }}
            error={error ?? undefined}
            autoFocus
          />

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={handleClose} fullWidth>
              Cancelar
            </Button>
            <Button type="submit" fullWidth disabled={!link.trim()}>
              Ir al grupo
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
