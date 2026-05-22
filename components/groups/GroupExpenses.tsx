'use client'

import { Receipt, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Expense, ExpenseSplit } from '@/lib/types'

interface Props {
  expenses: (Expense & { profiles: any; expense_splits: (ExpenseSplit & { profiles: any })[] })[]
  currentUserId: string
  groupId: string
  currency: string
}

export function GroupExpenses({ expenses, currentUserId, currency }: Props) {
  if (expenses.length === 0) {
    return (
      <div className="text-center py-12">
        <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No expenses yet</p>
        <p className="text-gray-400 text-xs mt-1">Tap + to add the first expense</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {expenses.map(exp => {
        const iPaid = exp.paid_by === currentUserId
        const mySplit = exp.expense_splits?.find(s => s.user_id === currentUserId)
        const myAmount = mySplit?.amount ?? 0
        const settled = mySplit?.settled ?? false

        return (
          <Card key={exp.id} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iPaid ? 'bg-green-100' : 'bg-orange-50'}`}>
                    {iPaid
                      ? <ArrowUpRight className="w-4 h-4 text-green-600" />
                      : <ArrowDownLeft className="w-4 h-4 text-orange-500" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{exp.description}</p>
                    <p className="text-xs text-gray-500">
                      {iPaid ? 'You paid' : `${exp.profiles?.full_name ?? 'Someone'} paid`}
                      {' · '}
                      {new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    {mySplit && !settled && (
                      <p className={`text-xs mt-0.5 font-medium ${iPaid ? 'text-green-600' : 'text-orange-500'}`}>
                        {iPaid
                          ? `You lent ${currency} ${(Number(exp.amount) - myAmount).toFixed(2)}`
                          : `You owe ${currency} ${myAmount.toFixed(2)}`}
                      </p>
                    )}
                    {settled && (
                      <Badge variant="outline" className="text-xs mt-0.5 text-green-600 border-green-200">Settled</Badge>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-gray-900">{currency} {Number(exp.amount).toFixed(2)}</p>
                  <p className="text-xs text-gray-400">{exp.split_type}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
