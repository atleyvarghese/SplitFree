import type { Expense, ExpenseSplit, Settlement, Balance } from '@/lib/types'

export function calculateBalances(
  expenses: (Expense & { splits: ExpenseSplit[] })[],
  settlements: Settlement[],
  currentUserId: string,
  members: { id: string; full_name: string | null; email: string }[]
): Balance[] {
  const netMap = new Map<string, number>()

  members.forEach(m => {
    if (m.id !== currentUserId) netMap.set(m.id, 0)
  })

  // Process expenses
  expenses.forEach(expense => {
    expense.splits?.forEach(split => {
      if (split.settled) return

      if (expense.paid_by === currentUserId && split.user_id !== currentUserId) {
        // Others owe me
        netMap.set(split.user_id, (netMap.get(split.user_id) ?? 0) + split.amount)
      } else if (split.user_id === currentUserId && expense.paid_by !== currentUserId) {
        // I owe payer
        netMap.set(expense.paid_by, (netMap.get(expense.paid_by) ?? 0) - split.amount)
      }
    })
  })

  // Process settlements
  settlements.forEach(s => {
    if (s.paid_by === currentUserId) {
      // I paid someone — reduce what I owe them
      netMap.set(s.paid_to, (netMap.get(s.paid_to) ?? 0) + s.amount)
    } else if (s.paid_to === currentUserId) {
      // Someone paid me — reduce what they owe me
      netMap.set(s.paid_by, (netMap.get(s.paid_by) ?? 0) - s.amount)
    }
  })

  return Array.from(netMap.entries())
    .filter(([id]) => id !== currentUserId)
    .map(([userId, amount]) => {
      const member = members.find(m => m.id === userId)
      return {
        userId,
        name: member?.full_name ?? member?.email ?? 'Unknown',
        email: member?.email ?? '',
        amount,
      }
    })
    .filter(b => Math.abs(b.amount) > 0.001)
}

export function computeSplitAmounts(
  total: number,
  splitType: 'equal' | 'percentage' | 'exact' | 'shares',
  participants: { userId: string; value: number }[]
): { userId: string; amount: number }[] {
  if (splitType === 'equal') {
    const each = Math.floor((total / participants.length) * 100) / 100
    const remainder = Math.round((total - each * participants.length) * 100) / 100
    return participants.map((p, i) => ({
      userId: p.userId,
      amount: i === 0 ? each + remainder : each,
    }))
  }

  if (splitType === 'percentage') {
    return participants.map(p => ({
      userId: p.userId,
      amount: Math.round((total * p.value) / 100 * 100) / 100,
    }))
  }

  if (splitType === 'exact') {
    return participants.map(p => ({ userId: p.userId, amount: p.value }))
  }

  if (splitType === 'shares') {
    const totalShares = participants.reduce((sum, p) => sum + p.value, 0)
    return participants.map(p => ({
      userId: p.userId,
      amount: Math.round((total * p.value / totalShares) * 100) / 100,
    }))
  }

  return []
}
