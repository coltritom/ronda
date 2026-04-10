'use client'

import { useState, useRef, useEffect } from 'react'
import { getOrCreateInvite } from '@/lib/actions/invites'

export function InviteButton({ groupId }: { groupId: string }) {
  const [open, setOpen]     = useState(false)
  const [link, setLink]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  /* Cerrar al hacer click fuera */
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  async function handleOpen() {
    if (open) { setOpen(false); return }
    if (link)  { setOpen(true);  return }

    setLoading(true)
    const result = await getOrCreateInvite(groupId)
    setLoading(false)

    if ('token' in result) {
      setLink(`${window.location.origin}/invite/${result.token}`)
      setOpen(true)
    }
  }

  async function handleCopy() {
    if (!link) return
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={handleOpen}
        disabled={loading}
        className="flex items-center gap-2 rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-foreground hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
        {loading ? 'Generando…' : 'Invitar'}
      </button>

      {open && link && (
        <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-xl border border-border bg-surface p-3 shadow-lg">
          <p className="mb-2 text-xs font-medium text-muted">Link de invitación</p>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2">
            <span className="min-w-0 flex-1 truncate text-xs text-foreground">{link}</span>
            <button
              onClick={handleCopy}
              className="flex-shrink-0 text-xs font-medium text-accent hover:text-accent-hover transition-colors"
            >
              {copied ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>
          <p className="mt-2 text-xs text-muted">
            Cualquiera con este link puede unirse al grupo.
          </p>
        </div>
      )}
    </div>
  )
}
