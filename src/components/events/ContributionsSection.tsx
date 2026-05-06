'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Plus, ChevronDown } from 'lucide-react'
import { createContribution, deleteContribution } from '@/lib/actions/contributions'
import { APORTE_CATEGORIES, getMemberColor, type AporteId } from '@/lib/constants'
import { toast } from 'sonner'

interface Contribution {
  id: string
  category: AporteId
  description: string | null
  quantity: number
  user_id: string
  profiles: { name: string } | null
}

interface ContributionsSectionProps {
  eventId: string
  currentUserId: string
  contributions: Contribution[]
  canAdd: boolean
}

function groupByMember(contributions: Contribution[]) {
  const order: string[] = []
  const map: Record<string, { name: string; items: Contribution[]; score: number }> = {}
  for (const c of contributions) {
    if (!map[c.user_id]) {
      order.push(c.user_id)
      map[c.user_id] = { name: c.profiles?.name ?? 'Alguien', items: [], score: 0 }
    }
    const cat = APORTE_CATEGORIES.find((a) => a.id === c.category)
    map[c.user_id].items.push(c)
    map[c.user_id].score += (cat?.weight ?? 1) * (c.quantity ?? 1)
  }
  return order
    .map((uid, i) => ({ userId: uid, colorIndex: i, ...map[uid] }))
    .sort((a, b) => b.score - a.score)
}

export function ContributionsSection({
  eventId,
  currentUserId,
  contributions,
  canAdd,
}: ContributionsSectionProps) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [catOpen, setCatOpen] = useState(false)
  const [category, setCategory] = useState<AporteId>(APORTE_CATEGORIES[0].id)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleAdd() {
    setLoading(true)
    const error = await createContribution(eventId, category, description.trim() || null, 1)
    setLoading(false)
    if (!error) {
      toast.success('Aporte agregado')
      setAdding(false)
      setDescription('')
      setCategory(APORTE_CATEGORIES[0].id)
      router.refresh()
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    await deleteContribution(id)
    setDeleting(null)
    router.refresh()
  }

  const grouped = groupByMember(contributions)
  const selectedCat = APORTE_CATEGORIES.find((c) => c.id === category)

  if (contributions.length === 0 && !adding) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-niebla mb-1">Nadie aportó nada todavía.</p>
        <p className="text-xs text-niebla/60 mb-4">Es opcional — no todas las juntadas necesitan aportes.</p>
        {canAdd && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 mx-auto rounded-full border border-dashed border-fuego/40 px-4 py-2 text-[13px] font-semibold text-fuego hover:bg-fuego/5 transition-colors"
          >
            <Plus size={14} />
            Agregar aporte
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Lista agrupada por miembro */}
      {grouped.map((g, gi) => {
        const color = getMemberColor(g.colorIndex)
        return (
          <div key={g.userId} className={gi > 0 ? 'border-t border-white/[0.06] pt-3' : undefined}>
            <div className="flex items-center gap-2.5 mb-2">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 bg-${color}/20 text-${color}`}
              >
                {g.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-humo">
                  {g.userId === currentUserId ? 'Yo' : g.name}
                </p>
                <p className="text-[11px] text-niebla">
                  {g.items.length} aporte{g.items.length !== 1 ? 's' : ''} · {g.score} pts
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 ml-[46px]">
              {g.items.map((item) => {
                const cat = APORTE_CATEGORIES.find((c) => c.id === item.category)
                return (
                  <div key={item.id} className="flex items-center gap-2 group">
                    <span className="text-sm">{cat?.emoji ?? '📦'}</span>
                    <span className="text-sm text-humo">{cat?.label ?? item.category}</span>
                    {item.description && (
                      <span className="text-xs text-niebla">— {item.description}</span>
                    )}
                    <span className="text-[10px] text-niebla/50 ml-auto">
                      +{(cat?.weight ?? 1) * (item.quantity ?? 1)}
                    </span>
                    {item.user_id === currentUserId && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deleting === item.id}
                        className="opacity-0 group-hover:opacity-100 text-niebla hover:text-error transition-all disabled:opacity-40"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Puntaje ponderado — mini tabla */}
      {grouped.length > 1 && (
        <div className="bg-noche rounded-xl p-3">
          <p className="text-[11px] font-semibold text-niebla uppercase tracking-wider mb-1.5">
            Puntaje de aportes
          </p>
          <p className="text-[10px] text-niebla/60 mb-2">
            No es lo mismo llevar la carne que llevar hielo. Cada aporte tiene un peso distinto.
          </p>
          {grouped.map((g, i) => {
            const color = getMemberColor(g.colorIndex)
            return (
              <div key={g.userId} className={`flex items-center gap-2 py-1.5 ${i > 0 ? 'border-t border-white/[0.04]' : ''}`}>
                <span className="w-4 text-center text-xs font-bold text-niebla">{i + 1}</span>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-${color}/20 text-${color}`}>
                  {g.name.charAt(0).toUpperCase()}
                </div>
                <span className="flex-1 text-sm text-humo">
                  {g.userId === currentUserId ? 'Yo' : g.name}
                </span>
                <span className="text-sm font-semibold text-humo">{g.score} pts</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Agregar aporte */}
      {canAdd && (
        adding ? (
          <div className="bg-noche-media rounded-2xl p-4 flex flex-col gap-3">
            <p className="font-semibold text-sm text-humo">Agregar aporte</p>

            {/* Categoría dropdown */}
            <div className="relative">
              <p className="text-xs text-niebla mb-1.5">Categoría</p>
              <button
                type="button"
                onClick={() => setCatOpen(!catOpen)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] border-[1.5px] border-white/[0.08] bg-noche cursor-pointer"
              >
                <span className="flex items-center gap-2 text-sm text-humo">
                  <span>{selectedCat?.emoji}</span>
                  {selectedCat?.label}
                  <span className="text-[10px] text-niebla">+{selectedCat?.weight}</span>
                </span>
                <ChevronDown size={16} className={`text-niebla transition-transform ${catOpen ? 'rotate-180' : ''}`} />
              </button>
              {catOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-noche-media rounded-xl border border-white/[0.08] overflow-hidden z-10 shadow-lg max-h-[220px] overflow-y-auto">
                  {APORTE_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => { setCategory(cat.id); setCatOpen(false) }}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left border-none cursor-pointer text-sm transition-colors ${
                        category === cat.id
                          ? 'bg-fuego/10 text-fuego font-medium'
                          : 'bg-transparent text-humo hover:bg-white/5'
                      }`}
                    >
                      <span>{cat.emoji}</span>
                      <span className="flex-1">{cat.label}</span>
                      <span className="text-[10px] text-niebla">+{cat.weight}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Detalle */}
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalle (opcional). Ej: Vacío y chorizo"
              className="w-full px-3.5 py-2.5 rounded-[10px] border-[1.5px] border-white/[0.08] bg-noche text-sm text-humo placeholder:text-niebla/50 outline-none focus:border-fuego/50 transition-colors"
            />

            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={loading}
                className="flex-1 rounded-full bg-fuego py-2.5 text-sm font-semibold text-white hover:bg-fuego/90 transition-colors disabled:opacity-60"
              >
                {loading ? 'Guardando…' : 'Agregar'}
              </button>
              <button
                type="button"
                onClick={() => { setAdding(false); setDescription('') }}
                className="px-4 py-2.5 rounded-xl text-sm text-niebla bg-transparent border border-white/[0.08] cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center justify-center gap-2 w-full rounded-full border border-dashed border-fuego/40 px-4 py-2.5 text-[13px] font-semibold text-fuego hover:bg-fuego/5 transition-colors"
          >
            <Plus size={14} />
            Agregar aporte
          </button>
        )
      )}

      <p className="text-xs text-niebla/60 text-center">
        Los aportes son opcionales. Si nadie llevó nada, no pasa nada.
      </p>
    </div>
  )
}
