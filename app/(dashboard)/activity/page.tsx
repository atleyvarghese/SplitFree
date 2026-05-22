import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Receipt, HandCoins, Activity } from 'lucide-react'

export default async function ActivityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)

  const groupIds = memberships?.map(m => m.group_id) ?? []

  const [expensesRes, settlementsRes] = await Promise.all([
    groupIds.length ? supabase
      .from('expenses')
      .select('id, description, amount, currency, date, created_at, paid_by, group_id, groups(name), profiles!paid_by(full_name)')
      .in('group_id', groupIds)
      .order('created_at', { ascending: false })
      .limit(50) : { data: [] },
    groupIds.length ? supabase
      .from('settlements')
      .select('id, amount, currency, created_at, paid_by, paid_to, group_id, groups(name), payer:profiles!paid_by(full_name), payee:profiles!paid_to(full_name)')
      .in('group_id', groupIds)
      .order('created_at', { ascending: false })
      .limit(20) : { data: [] },
  ])

  type ActivityItem = {
    id: string
    type: 'expense' | 'settlement'
    created_at: string
    data: any
  }

  const activities: ActivityItem[] = [
    ...(expensesRes.data ?? []).map((e: any) => ({ id: e.id, type: 'expense' as const, created_at: e.created_at, data: e })),
    ...(settlementsRes.data ?? []).map((s: any) => ({ id: s.id, type: 'settlement' as const, created_at: s.created_at, data: s })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Activity</h1>

      {activities.length === 0 ? (
        <div className="text-center py-16">
          <Activity className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No activity yet</p>
          <p className="text-gray-400 text-sm">Join a group and add expenses to see activity here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map(item => {
            const d = item.data
            if (item.type === 'expense') {
              const iPaid = d.paid_by === user.id
              return (
                <Card key={`exp-${item.id}`} className="border-0 shadow-sm">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Receipt className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{iPaid ? 'You' : (d.profiles?.full_name ?? 'Someone')}</span>
                        {' added '}
                        <span className="font-medium">{d.description}</span>
                        {' in '}
                        <span className="text-indigo-600">{d.groups?.name}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {d.currency} {Number(d.amount).toFixed(2)} · {new Date(d.created_at).toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            } else {
              const iPaid = d.paid_by === user.id
              const iReceived = d.paid_to === user.id
              return (
                <Card key={`set-${item.id}`} className="border-0 shadow-sm">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <HandCoins className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{iPaid ? 'You' : (d.payer?.full_name ?? 'Someone')}</span>
                        {' paid '}
                        <span className="font-medium">{iReceived ? 'you' : (d.payee?.full_name ?? 'someone')}</span>
                        {' in '}
                        <span className="text-indigo-600">{d.groups?.name}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {d.currency} {Number(d.amount).toFixed(2)} · {new Date(d.created_at).toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            }
          })}
        </div>
      )}
    </div>
  )
}
