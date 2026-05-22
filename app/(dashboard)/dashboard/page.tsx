import { createClient } from '@/lib/supabase/server'
import { ArrowUpRight, ArrowDownLeft, Users, Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { LinkButton } from '@/components/ui/link-button'
import { formatCurrency } from '@/lib/utils/format'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id, groups(id, name, default_currency, created_at)')
    .eq('user_id', user.id)

  const groups = memberships?.map(m => m.groups).filter(Boolean) ?? []
  const groupIds = groups.map((g: any) => g.id)

  const { data: recentExpenses } = groupIds.length ? await supabase
    .from('expenses')
    .select('id, description, amount, currency, date, paid_by, profiles!paid_by(full_name)')
    .in('group_id', groupIds)
    .order('created_at', { ascending: false })
    .limit(5) : { data: [] }

  const { data: iOwe } = await supabase
    .from('expense_splits')
    .select('amount, expenses!inner(paid_by)')
    .eq('user_id', user.id)
    .eq('settled', false)
    .neq('expenses.paid_by', user.id)

  const { data: owedMe } = await supabase
    .from('expense_splits')
    .select('amount, expenses!inner(paid_by)')
    .eq('expenses.paid_by', user.id)
    .eq('settled', false)
    .neq('user_id', user.id)

  const totalOwe = iOwe?.reduce((s, r) => s + Number(r.amount), 0) ?? 0
  const totalOwed = owedMe?.reduce((s, r) => s + Number(r.amount), 0) ?? 0
  const netBalance = totalOwed - totalOwe

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">You owe</p>
            <p className="text-base font-bold text-red-500">{formatCurrency(totalOwe)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Owed to you</p>
            <p className="text-base font-bold text-green-600">{formatCurrency(totalOwed)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Net</p>
            <p className={`text-base font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {netBalance >= 0 ? '+' : ''}{formatCurrency(Math.abs(netBalance))}
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">Your groups</h2>
          <LinkButton href="/groups/new" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white h-8">
            <Plus className="w-4 h-4 mr-1" /> New group
          </LinkButton>
        </div>
        {groups.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-200 shadow-none">
            <CardContent className="py-10 text-center">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm mb-4">No groups yet. Create one to start splitting!</p>
              <LinkButton href="/groups/new" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Plus className="w-4 h-4 mr-1" /> Create group
              </LinkButton>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {groups.map((group: any) => (
              <LinkButton key={group.id} href={`/groups/${group.id}`} variant="ghost" className="w-full h-auto p-0">
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow w-full">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <Users className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{group.name}</p>
                        <p className="text-xs text-gray-500">{group.default_currency}</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-gray-400" />
                  </CardContent>
                </Card>
              </LinkButton>
            ))}
          </div>
        )}
      </div>

      {recentExpenses && recentExpenses.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Recent expenses</h2>
          <div className="space-y-2">
            {recentExpenses.map((exp: any) => (
              <Card key={exp.id} className="border-0 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${exp.paid_by === user.id ? 'bg-green-100' : 'bg-red-50'}`}>
                      {exp.paid_by === user.id
                        ? <ArrowUpRight className="w-4 h-4 text-green-600" />
                        : <ArrowDownLeft className="w-4 h-4 text-red-500" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{exp.description}</p>
                      <p className="text-xs text-gray-400">
                        {exp.paid_by === user.id ? 'You paid' : `${(exp.profiles as any)?.full_name ?? 'Someone'} paid`}
                        {' · '}{new Date(exp.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {exp.currency} {Number(exp.amount).toFixed(2)}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
