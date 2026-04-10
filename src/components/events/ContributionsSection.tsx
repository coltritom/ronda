'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createContribution, deleteContribution } from '@/lib/actions/contributions'

type Category = 'bebida' | 'comida' | 'postre' | 'hielo' | 'snacks' | 'juegos' | 'utensilios' | 'otros'

const CATEGORIES: { value: Category; label: string; emoji: string }[] = [
  { value: 'bebida',     label: 'Bebida',     emoji: '🍺' },
  { value: 'comida',     label: 'Comida',     emoji: '🍖' },
  { value: 'postre',     label: 'Postre',     emoji: '🍰' },
  { value: 'hielo',      label: 'Hielo',      emoji: '🧊' },
  { value: 'snacks',     label: 'Snacks',     emoji: '🍿' },
  { value: 'juegos',     label: 'Juegos',     emoji: '🎮' },
  { value: 'utensilios', label: 'Utensilios', emoji: '🍽️' },
  { value: 'otros',      label: 'Otros',      emoji: '📦' },
]

interface Attendee {
  user_id: string
  name: string
}

interface Contribution {
  id: string
  category: Category
  description: string | null
  quantity: number
  user_id: string
  profiles: { name: string } | null
}

interface ContributionsSectionProps {
  eventId: string
  currentUserId: string
  contributions: Contribution[]
  attendees: Attendee[]      // confirmados (going)
  isUpcoming: boolean
}

export function ContributionsSection({
  eventId,
  currentUserId,
  contributions,
  attendees,
  isUpcoming,
}: ContributionsSectionProps) {
  const router = useRouter()
  const [showForm, setShowForm]       = useState(false)
  const [category, setCategory]       = useState<Category>('bebida')
  const [forUserId, setForUserId]     = useState(currentUserId)
  const [description, setDescription] = useState('')
  const [quantity, setQuantity]       = useState(1)
  const [loading, setLoading]         = useState(false)
  const [deleting, setDeleting]       = useState<string | null>(null)

  /* Siempre incluir al usuario actual aunque no haya confirmado */
  const allAttendees: Attendee[] = attendees.some((a) => a.user_id === currentUserId)
    ? attendees
    : [{ user_id: currentUserId, name: 'Yo' }, ...attendees]

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const error = await createContribution(
      eventId,
      category,
      description.trim() || null,
      quantity,
      forUserId
    )
    setLoading(false)
    if (!error) {
      setShowForm(false)
      setDescription('')
      setQuantity(1)
      setForUserId(currentUserId)
      router.refresh()
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    await deleteContribution(id)
    setDeleting(null)
    router.refresh()
  }

  /* Agrupar por categoría */
  const byCat = CATEGORIES
    .map((cat) => ({
      ...cat,
      items: contributions.filter((c) => c.category === cat.value),
    }))
    .filter((cat) => cat.items.length > 0)

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">¿Qué llevan?</p>
        {isUpcoming && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-xs font-medium text-accent hover:text-accent-hover transition-colors"
          >
            + Agregar
          </button>
        )}
      </div>

      {/* Formulario */}
      {showForm && (
        <form onSubmit={handleAdd} className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-surface-2 p-4">

          {/* Selector de persona */}
          {allAttendees.length > 1 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted">¿Para quién?</span>
              <div className="flex flex-wrap gap-2">
                {allAttendees.map((a) => (
                  <button
                    key={a.user_id}
                    type="button"
                    onClick={() => setForUserId(a.user_id)}
                    className={`
                      flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium
                      transition-all
                      ${forUserId === a.user_id
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border text-muted hover:border-accent/40 hover:text-foreground'
                      }
                    `}
                  >
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent/20 text-accent font-bold" style={{ fontSize: 9 }}>
                      {(a.name ?? '?').charAt(0).toUpperCase()}
                    </span>
                    <span>{a.user_id === currentUserId ? 'Yo' : a.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selector de categoría */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`
                  flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium
                  transition-all
                  ${category === cat.value
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-muted hover:border-accent/40 hover:text-foreground'
                  }
                `}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Descripción + cantidad */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Descripción (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={80}
              className="
                min-w-0 flex-1 rounded-lg border border-border bg-surface
                px-3 py-2 text-sm text-foreground placeholder:text-muted
                focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
              "
            />
            <input
              type="number"
              min={1}
              max={99}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="
                w-16 rounded-lg border border-border bg-surface
                px-3 py-2 text-sm text-foreground text-center
                focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
              "
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 rounded-lg border border-border py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-accent py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors disabled:opacity-60"
            >
              {loading ? 'Guardando…' : 'Agregar'}
            </button>
          </div>
        </form>
      )}

      {/* Lista agrupada por categoría */}
      {byCat.length > 0 ? (
        <div className="flex flex-col gap-4">
          {byCat.map((cat) => (
            <div key={cat.value}>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </p>
              <div className="flex flex-col gap-2">
                {cat.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-2.5"
                  >
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-foreground">
                        {item.user_id === currentUserId ? 'Yo' : (item.profiles?.name ?? 'Alguien')}
                      </span>
                      {item.description && (
                        <span className="ml-2 text-sm text-muted">— {item.description}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {item.quantity > 1 && (
                        <span className="text-xs font-medium text-muted">×{item.quantity}</span>
                      )}
                      {item.user_id === currentUserId && (
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deleting === item.id}
                          className="text-muted hover:text-red-400 transition-colors disabled:opacity-40"
                          title="Eliminar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">
          {isUpcoming ? 'Nadie agregó aportes todavía.' : 'No hubo aportes registrados.'}
        </p>
      )}
    </section>
  )
}
