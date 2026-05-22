export type SplitType = 'equal' | 'percentage' | 'exact' | 'shares'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface Group {
  id: string
  name: string
  description: string | null
  default_currency: string
  created_by: string
  created_at: string
  member_count?: number
  total_balance?: number
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  role: 'admin' | 'member'
  joined_at: string
  profile?: Profile
}

export interface Expense {
  id: string
  group_id: string
  description: string
  amount: number
  currency: string
  paid_by: string
  split_type: SplitType
  date: string
  notes: string | null
  created_by: string
  created_at: string
  payer?: Profile
  splits?: ExpenseSplit[]
}

export interface ExpenseSplit {
  id: string
  expense_id: string
  user_id: string
  amount: number
  settled: boolean
  settled_at: string | null
  profile?: Profile
}

export interface Settlement {
  id: string
  group_id: string
  paid_by: string
  paid_to: string
  amount: number
  currency: string
  notes: string | null
  created_at: string
  payer?: Profile
  payee?: Profile
}

export interface GroupInvitation {
  id: string
  group_id: string
  email: string
  invited_by: string | null
  token: string
  accepted: boolean
  created_at: string
}

export interface Balance {
  userId: string
  name: string
  email: string
  amount: number // positive = they owe you, negative = you owe them
}

export interface NewExpenseSplit {
  userId: string
  amount: number
  percentage?: number
  shares?: number
}
