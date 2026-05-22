'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Loader2, Plus, X } from 'lucide-react'
import { LinkButton } from '@/components/ui/link-button'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'JPY', 'SGD', 'AED']

export default function NewGroupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [memberEmail, setMemberEmail] = useState('')
  const [members, setMembers] = useState<string[]>([])

  function addMember() {
    const email = memberEmail.trim().toLowerCase()
    if (!email || !email.includes('@')) {
      toast.error('Enter a valid email address')
      return
    }
    if (members.includes(email)) {
      toast.error('Email already added')
      return
    }
    setMembers(prev => [...prev, email])
    setMemberEmail('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { toast.error('Group name is required'); return }
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: group, error } = await supabase
      .from('groups')
      .insert({ name: name.trim(), description: description.trim() || null, default_currency: currency, created_by: user.id })
      .select()
      .single()

    if (error || !group) {
      toast.error('Failed to create group')
      setLoading(false)
      return
    }

    await supabase.from('group_members').insert({ group_id: group.id, user_id: user.id, role: 'admin' })

    for (const email of members) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (existingProfile) {
        await supabase.from('group_members').insert({ group_id: group.id, user_id: existingProfile.id, role: 'member' })
      } else {
        await supabase.from('group_invitations').insert({ group_id: group.id, email, invited_by: user.id })
      }
    }

    toast.success('Group created!')
    router.push(`/groups/${group.id}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <LinkButton href="/groups" variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4" />
        </LinkButton>
        <h1 className="text-xl font-bold text-gray-900">New group</h1>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Group name *</Label>
              <Input
                id="name"
                placeholder="e.g. Bali Trip, Apartment, Team Lunch"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Description (optional)</Label>
              <Input
                id="desc"
                placeholder="What's this group for?"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Default currency</Label>
              <Select value={currency} onValueChange={(v) => v && setCurrency(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Invite members (optional)</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="friend@example.com"
                  value={memberEmail}
                  onChange={e => setMemberEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addMember())}
                />
                <Button type="button" variant="outline" onClick={addMember}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {members.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {members.map(email => (
                    <span key={email} className="flex items-center gap-1 bg-indigo-50 text-indigo-700 rounded-full px-3 py-1 text-sm">
                      {email}
                      <button type="button" onClick={() => setMembers(m => m.filter(e => e !== email))}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create group
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
