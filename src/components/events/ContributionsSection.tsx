'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Plus } from 'lucide-react'
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

interface Contribution {
  id: string
  category: Category
  description: string | null
  quantity: number
  user_id: string
  profiles: { name: string } | null
}

interface ContributionsSectionProps {
  eventId:       string
  currentUserId: string
  contributions: Contribution[]
  isUpcoming:    boolean
}

export function ContributionsSection({
  eventId,
  currentUserId,
  contributions,
  isUpcoming,
}: ContributionsSectionProps) {
  const router = useRouter()
  const [showForm, setShowForm]       = useState(false)
  const [category, setCategory]       = useState<Category>('bebida')
  const [description, setDescription] = useState('')
  const [quantity, setQuantity]       = useState(1)
  const [loading, setLoading]         = useState(false)
  const [deleting, setDeleting]       = useState<string | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const error = await createContribution(eventId, category, description.trim() || null, quantity)
    setLoading(false)
    if (!error) {
      setShowForm(false)
      setDescription('')
      setQuantity(1)
      router.refresh()
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    await deleteContribution(id)
    setDeleting(null)
    router.refresh()
  }

  const byCat = CATEGORIES
    .map((cat) => ({ ...cat, items: contributions.filter((c) => c.category === cat.value) }))
    .filter((cat) => cat.items.length > 0)

  return (
    <div className="flex flex-col gap-4">

      {/* Header */}
      {isUpcoming && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 self-start rounded-xl border border-dashed border-fuego/40 px-3.5 py-2 font-body text-sm font-medium text-fuego hover:bg-fuego/5 transition-colors"
        >
          <Plus size={15} />
          Agregar aporte
        </button>
      )}

      {/* Formulario */}
      {showForm && (
        <form onSubmit={handleAdd} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-2 p-4">

          {/* Categoría */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-body text-xs font-medium transition-all ${
                  category === cat.value
                    ? 'border-fuego bg-fuego/10 text-fuego'
                    : 'border-border text-muted hover:border-fuego/30 hover:text-foreground'
                }`}
              >
                <span>{cat.emoji}</span>
                {cat.label}
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
              className="min-w-0 flex-1 rounded-[10px] border-[1.5px] border-border bg-surface px-3 py-2 font-body text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
            <input
              type="number"
              min={1}
              max={99}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-16 rounded-[10px] border-[1.5px] border-border bg-surface px-3 py-2 text-center font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 rounded-xl border border-border py-2 font-body text-sm font-medium text-muted hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-fuego py-2 font-body text-sm font-medium text-white hover:bg-fuego/90 transition-colors disabled:opacity-60"
            >
              {loading ? 'Guardando…' : 'Agregar'}
            </button>
          </div>
        </form>
      )}

      {/* Lista agrupada */}
      {byCat.length > 0 ? (
        <div className="flex flex-col gap-4">
          {byCat.map((cat) => (
            <div key={cat.value}>
              <p className="mb-2 flex items-center gap-1.5 font-body text-xs font-semibold uppercase tracking-wider text-muted">
                {cat.emoji} {cat.label}
              </p>
              <div className="flex flex-col gap-2">
                {cat.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-2.5"
                  >
                    <div className="min-w-0">
                      <span className="font-body text-sm font-medium text-foreground">
                        {item.user_id === currentUserId ? 'Yo' : (item.profiles?.name ?? 'Alguien')}
                      </span>
                      {item.description && (
                        <span className="ml-2 font-body text-sm text-muted">— {item.description}</span>
                      )}
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-3">
                      {item.quantity > 1 && (
                        <span className="font-body text-xs font-medium text-muted">×{item.quantity}</span>
                      )}
                      {item.user_id === currentUserId && (
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deleting === item.id}
                          className="text-muted hover:text-error transition-colors disabled:opacity-40"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
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
        <p className="font-body text-sm text-muted">
          {isUpcoming ? 'Nadie agregó aportes todavía.' : 'No hubo aportes registrados.'}
        </p>
      )}
    </div>
  )
}
