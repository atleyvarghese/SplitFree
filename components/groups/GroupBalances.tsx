'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { CheckCircle, ArrowRight } from 'lucide-react'
import type { Balance } from '@/lib/types'
import { getInitials } from '@/lib/utils/format'

interface Props {
  balances: Balance[]
  groupId: string
  currency: string
  currentUserId: string
}

export function GroupBalances({ balances, groupId, currency, currentUserId }: Props) {
  const [settling, setSettling] = useState<string | null>(null)

  async function settle(balance: Balance) {
    setSettling(balance.userId)
    const supabase = createClient()
    const amount = Math.abs(balance.amount)

    const { error } = await supabase.from('settlements').insert({
      group_id: groupId,
      paid_by: balance.amount < 0 ? currentUserId : balance.userId,
      paid_to: balance.amount < 0 ? balance.userId : currentUserId,
      amount,
      currency,
    })

    if (error) {
      toast.error('Failed to record settlement')
    } else {
      toast.success('Settlement recorded!')
      window.location.reload()
    }
    setSettling(null)
  }

  if (balances.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">All settled up!</p>
        <p className="text-gray-400 text-sm mt-1">No outstanding balances in this group</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {balances.map(balance => {
        const owesYou = balance.amount > 0
        return (
          <Card key={balance.userId} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="w-9 h-9 flex-shrink-0">
                  <AvatarFallback className={`text-sm font-semibold ${owesYou ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {getInitials(balance.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{balance.name}</p>
                  <p className={`text-sm font-semibold ${owesYou ? 'text-green-600' : 'text-red-500'}`}>
                    {owesYou
                      ? `owes you ${currency} ${balance.amount.toFixed(2)}`
                      : `you owe ${currency} ${Math.abs(balance.amount).toFixed(2)}`}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="flex-shrink-0 text-xs h-8"
                disabled={settling === balance.userId}
                onClick={() => settle(balance)}
              >
                {owesYou ? 'Record payment' : 'Settle up'}
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
