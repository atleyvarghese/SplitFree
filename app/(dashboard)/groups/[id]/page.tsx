import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GroupExpenses } from '@/components/groups/GroupExpenses'
import { GroupBalances } from '@/components/groups/GroupBalances'
import { GroupHeader } from '@/components/groups/GroupHeader'
import { AddExpenseButton } from '@/components/expenses/AddExpenseButton'
import { calculateBalances } from '@/lib/utils/balance'

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: group } = await supabase
    .from('groups')
    .select('*')
    .eq('id', id)
    .single()

  if (!group) notFound()

  const { data: members } = await supabase
    .from('group_members')
    .select('*, profiles(id, email, full_name, avatar_url)')
    .eq('group_id', id)

  const { data: expenses } = await supabase
    .from('expenses')
    .select('*, profiles!paid_by(id, email, full_name), expense_splits(*, profiles(id, email, full_name))')
    .eq('group_id', id)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  const { data: settlements } = await supabase
    .from('settlements')
    .select('*, payer:profiles!paid_by(id, email, full_name), payee:profiles!paid_to(id, email, full_name)')
    .eq('group_id', id)
    .order('created_at', { ascending: false })

  const memberProfiles = members?.map(m => m.profiles).filter(Boolean) ?? []

  const balances = calculateBalances(
    (expenses ?? []) as any,
    (settlements ?? []) as any,
    user.id,
    memberProfiles as any
  )

  const isMember = members?.some(m => m.user_id === user.id) ?? false
  if (!isMember) notFound()

  return (
    <div className="space-y-4">
      <GroupHeader group={group} memberCount={members?.length ?? 0} />

      <Tabs defaultValue="expenses">
        <TabsList className="w-full">
          <TabsTrigger value="expenses" className="flex-1">Expenses</TabsTrigger>
          <TabsTrigger value="balances" className="flex-1">Balances</TabsTrigger>
        </TabsList>
        <TabsContent value="expenses" className="mt-4 space-y-3">
          <GroupExpenses
            expenses={expenses ?? []}
            currentUserId={user.id}
            groupId={id}
            currency={group.default_currency}
          />
        </TabsContent>
        <TabsContent value="balances" className="mt-4">
          <GroupBalances
            balances={balances}
            groupId={id}
            currency={group.default_currency}
            currentUserId={user.id}
          />
        </TabsContent>
      </Tabs>

      <AddExpenseButton
        groupId={id}
        members={memberProfiles as any}
        currentUserId={user.id}
        currency={group.default_currency}
      />
    </div>
  )
}
