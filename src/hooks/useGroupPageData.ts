'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/clients'
import type { User } from '@supabase/supabase-js'
import type { JuntadaItem } from '@/lib/constants'

export type RankingEntry = {
  emoji: string
  label: string
  name: string
  detail: string
  memberEmoji: string
  memberColorIndex: number
  variant: 'ambar' | 'uva' | 'rosa'
}

export type MemberData = {
  emoji?: string
  name: string
  colorIndex?: number
}

type MemberRpcItem = { user_id: string; name: string }

type EventRpcItem = {
  id: string; name: string; date: string; location: string | null; status: string
  going: number; maybe: number; not_going: number
  attendance_count: number; total_spent: number
}

type GroupPageRpcResult = {
  error?: string
  group?: { id: string; name: string; emoji: string }
  members?: MemberRpcItem[]
  events?: EventRpcItem[]
  pending_count?: number
  pending_amount?: number
  attendance_by_member?: Record<string, number>
}

const RANK_EMOJIS  = ['🏆', '🥈', '🥉']
const RANK_LABELS  = ['El Presente', 'El Constante', 'El Fiel']
const RANK_VARIANTS = ['ambar', 'uva', 'rosa'] as const

export function useGroupPageData(id: string, user: User | undefined) {
  const isMountedRef = useRef(true)

  const [loading,    setLoading]    = useState(true)
  const [notFound,   setNotFound]   = useState(false)
  const [groupName,  setGroupName]  = useState('')
  const [groupEmoji, setGroupEmoji] = useState('🔥')
  const [members,    setMembers]    = useState<MemberData[]>([])
  const [juntadas,   setJuntadas]   = useState<JuntadaItem[]>([])
  const [pending,    setPending]    = useState<{ count: number; amount: number } | null>(null)
  const [ranking,    setRanking]    = useState<RankingEntry[]>([])

  useEffect(() => {
    isMountedRef.current = true
    return () => { isMountedRef.current = false }
  }, [])

  const load = useCallback(async () => {
    if (!user) return
    const supabase = createClient()

    const { data, error } = await supabase.rpc('get_group_page_data', {
      p_group_id: id,
      p_user_id:  user.id,
    })

    if (!isMountedRef.current) return

    const result = data as GroupPageRpcResult | null

    if (error || !result || result.error) {
      setNotFound(true)
      setLoading(false)
      return
    }

    setGroupName(result.group!.name)
    setGroupEmoji(result.group!.emoji)

    const rpcMembers = result.members ?? []
    const memberList: MemberData[] = rpcMembers.map((m, i) => ({
      name: m.name,
      colorIndex: i,
    }))
    setMembers(memberList)

    const memberCount = memberList.length
    const mappedJuntadas: JuntadaItem[] = (result.events ?? []).map((e) => {
      const noResponse = Math.max(0, memberCount - e.going - e.maybe - e.not_going)
      const formattedDate = new Intl.DateTimeFormat('es-AR', {
        weekday: 'short', day: 'numeric', month: 'short',
        timeZone: 'America/Argentina/Buenos_Aires',
      }).format(new Date(e.date))
      return {
        id: e.id, isoDate: e.date.slice(0, 10), date: formattedDate, name: e.name,
        attendees: e.attendance_count, totalSpent: e.total_spent,
        closed: e.status === 'completed', confirmed: e.going, unsure: e.maybe, noResponse,
      }
    })
    setJuntadas(mappedJuntadas)

    const pendingCount  = result.pending_count  ?? 0
    const pendingAmount = result.pending_amount ?? 0
    setPending(pendingCount > 0 ? { count: pendingCount, amount: pendingAmount } : null)

    const attendanceByMember = result.attendance_by_member ?? {}
    const topMembers = rpcMembers
      .map((m, i) => ({ ...m, count: attendanceByMember[m.user_id] ?? 0, colorIndex: i }))
      .filter((m) => m.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)

    setRanking(topMembers.map((m, i) => ({
      emoji:            RANK_EMOJIS[i],
      label:            RANK_LABELS[i],
      name:             m.name,
      detail:           `${m.count} juntada${m.count !== 1 ? 's' : ''}`,
      memberEmoji:      '',
      memberColorIndex: m.colorIndex,
      variant:          RANK_VARIANTS[i % 3],
    })))

    setLoading(false)
  }, [id, user])

  useEffect(() => { load() }, [load])

  return { loading, notFound, groupName, groupEmoji, members, juntadas, pending, ranking, reload: load }
}
