'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MoreVertical } from 'lucide-react'
import { updateEvent, deleteEvent } from '@/lib/actions/events'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { LugarSelector } from '@/components/juntada/LugarSelector'
import { LUGAR_OPTIONS, type LugarId } from '@/lib/constants'
import { createClient } from '@/lib/supabase/clients'

interface Member {
  id: string
  name: string
  emoji: string
  colorIndex: number
}

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

function parseLocation(
  locationStr: string | null,
  members: Member[]
): { lugar: LugarId | null; hostId: string | null; customName: string } {
  if (!locationStr) return { lugar: null, hostId: null, customName: '' }

  const exactMatch = LUGAR_OPTIONS.find((l) => l.label === locationStr)
  if (exactMatch) return { lugar: exactMatch.id, hostId: null, customName: '' }

  const casaPrefix = '🏠 En lo de '
  if (locationStr.startsWith(casaPrefix)) {
    const hostName = locationStr.slice(casaPrefix.length)
    const member = members.find((m) => m.name === hostName)
    if (member) return { lugar: 'casa', hostId: member.id, customName: '' }
    return { lugar: 'casa', hostId: 'otro', customName: locationStr }
  }

  return { lugar: 'otro', hostId: null, customName: locationStr }
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
  const [menuOpen, setMenuOpen]     = useState(false)
  const [editOpen, setEditOpen]     = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)

  // Edit form
  const [name, setName]               = useState(initialName)
  const [dateTime, setDateTime]       = useState(() => utcToArgDateTimeLocal(initialDate))
  const [description, setDescription] = useState(initialDescription ?? '')

  // Location
  const [lugar, setLugar]               = useState<LugarId | null>(null)
  const [hostId, setHostId]             = useState<string | null>(null)
  const [customLocation, setCustomLocation] = useState('')

  // Group members for LugarSelector
  const [members, setMembers]           = useState<Member[]>([])
  const [membersLoading, setMembersLoading] = useState(false)

  const menuRef = useRef<HTMLDivElement>(null)

  // Load group members once
  useEffect(() => {
    let mounted = true
    setMembersLoading(true)
    async function load() {
      const supabase = createClient()
      const { data: memberRows } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId)
      const userIds = (memberRows ?? []).map((m) => m.user_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds)
      const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.name]))
      if (!mounted) return
      setMembers(
        (memberRows ?? []).map((m, i) => ({
          id: m.user_id,
          name: profileMap[m.user_id] ?? 'Miembro',
          emoji: '',
          colorIndex: i,
        }))
      )
      setMembersLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [groupId])

  // Close menu on outside click
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
    setDescription(initialDescription ?? '')
    const parsed = parseLocation(initialLocation, members)
    setLugar(parsed.lugar)
    setHostId(parsed.hostId)
    setCustomLocation(parsed.customName)
    setError(null)
    setEditOpen(true)
  }

  function openDelete() {
    setMenuOpen(false)
    setError(null)
    setDeleteOpen(true)
  }

  function buildLocation(): string | null {
    if (!lugar) return null
    const opt = LUGAR_OPTIONS.find((l) => l.id === lugar)
    if (!opt) return null
    if (lugar === 'casa') {
      if (hostId && hostId !== 'otro') {
        const host = members.find((m) => m.id === hostId)
        return host ? `${opt.emoji} En lo de ${host.name}` : opt.label
      }
      if (hostId === 'otro' && customLocation.trim()) return customLocation.trim()
      return opt.label
    }
    if (lugar === 'otro') return customLocation.trim() || opt.label
    return opt.label
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await updateEvent(
      eventId,
      name.trim(),
      dateTime + ':00-03:00',
      buildLocation(),
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
          onClick={() => setMenuOpen((v) => !v)}
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

          <LugarSelector
            selected={lugar}
            onSelect={setLugar}
            hostId={hostId}
            onHostSelect={setHostId}
            members={members}
            membersLoading={membersLoading}
            customName={customLocation}
            onCustomNameChange={setCustomLocation}
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
