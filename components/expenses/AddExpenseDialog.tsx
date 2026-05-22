'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2, CheckSquare, Square } from 'lucide-react'
import { computeSplitAmounts } from '@/lib/utils/balance'
import { getInitials } from '@/lib/utils/format'
import type { Profile, SplitType } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  members: Profile[]
  currentUserId: string
  currency: string
}

type ParticipantValue = { userId: string; value: number; selected: boolean }

export function AddExpenseDialog({ open, onOpenChange, groupId, members, currentUserId, currency }: Props) {
  const [loading, setLoading] = useState(false)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [paidBy, setPaidBy] = useState(currentUserId)
  const [splitType, setSplitType] = useState<SplitType>('equal')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [participants, setParticipants] = useState<ParticipantValue[]>([])

  useEffect(() => {
    if (open) {
      setParticipants(members.map(m => ({ userId: m.id, value: 0, selected: true })))
      setDescription('')
      setAmount('')
      setPaidBy(currentUserId)
      setSplitType('equal')
      setDate(new Date().toISOString().split('T')[0])
    }
  }, [open, members, currentUserId])

  const selectedParticipants = participants.filter(p => p.selected)
  const total = parseFloat(amount) || 0

  function toggleParticipant(userId: string) {
    setParticipants(prev => prev.map(p =>
      p.userId === userId ? { ...p, selected: !p.selected } : p
    ))
  }

  function updateValue(userId: string, value: number) {
    setParticipants(prev => prev.map(p =>
      p.userId === userId ? { ...p, value } : p
    ))
  }

  function validateSplit(): string | null {
    if (!description.trim()) return 'Description is required'
    if (!total || total <= 0) return 'Enter a valid amount'
    if (selectedParticipants.length === 0) return 'Select at least one participant'

    if (splitType === 'percentage') {
      const sum = selectedParticipants.reduce((s, p) => s + p.value, 0)
      if (Math.abs(sum - 100) > 0.01) return `Percentages must sum to 100% (currently ${sum.toFixed(1)}%)`
    }
    if (splitType === 'exact') {
      const sum = selectedParticipants.reduce((s, p) => s + p.value, 0)
      if (Math.abs(sum - total) > 0.01) return `Amounts must sum to ${total.toFixed(2)} (currently ${sum.toFixed(2)})`
    }
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationError = validateSplit()
    if (validationError) { toast.error(validationError); return }

    setLoading(true)
    const supabase = createClient()

    const { data: expense, error } = await supabase
      .from('expenses')
      .insert({
        group_id: groupId,
        description: description.trim(),
        amount: total,
        currency,
        paid_by: paidBy,
        split_type: splitType,
        date,
        created_by: currentUserId,
      })
      .select()
      .single()

    if (error || !expense) {
      toast.error('Failed to add expense')
      setLoading(false)
      return
    }

    const splits = computeSplitAmounts(
      total,
      splitType,
      selectedParticipants.map(p => ({ userId: p.userId, value: p.value }))
    )

    const { error: splitError } = await supabase.from('expense_splits').insert(
      splits.map(s => ({
        expense_id: expense.id,
        user_id: s.userId,
        amount: s.amount,
        settled: s.userId === paidBy,
      }))
    )

    setLoading(false)
    if (splitError) {
      toast.error('Expense added but splits failed — please refresh')
    } else {
      toast.success('Expense added!')
      onOpenChange(false)
      window.location.reload()
    }
  }

  const splitPreview = total > 0 && selectedParticipants.length > 0
    ? computeSplitAmounts(total, splitType, selectedParticipants.map(p => ({ userId: p.userId, value: p.value })))
    : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Input
              id="desc"
              placeholder="e.g. Dinner, Uber, Groceries"
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ({currency})</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Paid by</Label>
            <Select value={paidBy} onValueChange={(v) => v && setPaidBy(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {members.map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.id === currentUserId ? 'You' : (m.full_name ?? m.email)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Split type</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['equal', 'percentage', 'exact', 'shares'] as SplitType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSplitType(t)}
                  className={cn(
                    'py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors capitalize',
                    splitType === t
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Participants */}
          <div className="space-y-2">
            <Label>Split among</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {participants.map(p => {
                const member = members.find(m => m.id === p.userId)
                if (!member) return null
                const preview = splitPreview.find(s => s.userId === p.userId)
                return (
                  <div key={p.userId} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleParticipant(p.userId)}
                      className="flex-shrink-0"
                    >
                      {p.selected
                        ? <CheckSquare className="w-5 h-5 text-indigo-600" />
                        : <Square className="w-5 h-5 text-gray-300" />}
                    </button>
                    <Avatar className="w-7 h-7 flex-shrink-0">
                      <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">
                        {getInitials(member.full_name ?? member.email)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-700 flex-1 truncate">
                      {p.userId === currentUserId ? 'You' : (member.full_name ?? member.email)}
                    </span>
                    {splitType !== 'equal' && p.selected && (
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder={splitType === 'percentage' ? '%' : splitType === 'shares' ? 'shares' : '0.00'}
                        value={p.value || ''}
                        onChange={e => updateValue(p.userId, parseFloat(e.target.value) || 0)}
                        className="w-20 h-7 text-sm text-right"
                      />
                    )}
                    {splitType === 'equal' && preview && p.selected && (
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {currency} {preview.amount.toFixed(2)}
                      </span>
                    )}
                    {splitType !== 'equal' && preview && p.selected && (
                      <span className="text-xs text-gray-400 flex-shrink-0 w-16 text-right">
                        ={currency} {preview.amount.toFixed(2)}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Add expense
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
