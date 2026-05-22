'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AddExpenseDialog } from './AddExpenseDialog'
import type { Profile } from '@/lib/types'

interface Props {
  groupId: string
  members: Profile[]
  currentUserId: string
  currency: string
}

export function AddExpenseButton({ groupId, members, currentUserId, currency }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-50 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95"
        aria-label="Add expense"
      >
        <Plus className="w-7 h-7" />
      </button>
      <AddExpenseDialog
        open={open}
        onOpenChange={setOpen}
        groupId={groupId}
        members={members}
        currentUserId={currentUserId}
        currency={currency}
      />
    </>
  )
}
