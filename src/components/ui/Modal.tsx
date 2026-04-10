'use client'

/*
  Modal reutilizable.
  - Se cierra con clic en el backdrop o presionando Escape
  - En mobile se abre desde abajo (sheet), en desktop centrado
  - Usa position:fixed para estar siempre sobre el resto del contenido
*/
import { useEffect } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  /* Cerrar con tecla Escape */
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  /* Bloquear scroll del body mientras el modal está abierto */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop oscuro */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel del modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="
          relative z-10 w-full sm:max-w-md
          rounded-t-2xl sm:rounded-2xl
          bg-surface border border-border
          shadow-2xl
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 id="modal-title" className="font-heading text-lg font-semibold text-foreground">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="
              flex h-8 w-8 items-center justify-center rounded-lg
              text-muted hover:text-foreground hover:bg-surface-2
              transition-colors
            "
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Contenido */}
        <div className="px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  )
}
