/*
  Tipos TypeScript para las entidades principales de la app.
  Reflejan la estructura de las tablas de Supabase.
*/

export interface Profile {
  id: string
  email: string
  name: string
  avatar_url: string | null
  created_at: string
}

export interface Group {
  id: string
  name: string
  description: string | null
  emoji: string | null
  created_by: string
  created_at: string
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  role: 'admin' | 'member'
  joined_at: string
}

/* Group con datos extra para mostrar en la UI */
export interface GroupWithMeta extends Group {
  role: 'admin' | 'member'
  member_count: number
}

export interface Event {
  id: string
  group_id: string
  name: string
  description: string | null
  date: string
  location: string | null
  status: 'upcoming' | 'completed' | 'cancelled'
  created_by: string
  created_at: string
}

export interface Contribution {
  id: string
  event_id: string
  user_id: string
  category: 'bebida' | 'comida' | 'postre' | 'hielo' | 'snacks' | 'juegos' | 'utensilios' | 'otros'
  description: string | null
  created_at: string
}

export interface Expense {
  id: string
  event_id: string
  paid_by: string
  amount: number
  description: string
  split_type: 'equal_all' | 'equal_some'
  created_at: string
}

/* UI display types shared across juntada components */
export interface UIMember {
  id: string
  name: string
  colorIndex: number
  isGuest?: boolean
}

export interface UIDebt {
  fromId: string
  toId: string
  amount: number
  paid?: boolean
}
