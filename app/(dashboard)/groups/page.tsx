import { createClient } from '@/lib/supabase/server'
import { Plus, Users, ArrowUpRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { LinkButton } from '@/components/ui/link-button'
import { ImportSplitwiseButton } from '@/components/groups/ImportSplitwiseButton'

export default async function GroupsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: memberships } = await supabase
    .from('group_members')
    .select('role, groups(id, name, description, default_currency, created_at, created_by)')
    .eq('user_id', user.id)

  const groups = memberships?.map(m => ({ ...m.groups, myRole: m.role })).filter(Boolean) ?? []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Groups</h1>
        <div className="flex gap-2">
          <ImportSplitwiseButton userId={user.id} />
          <LinkButton href="/groups/new" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="w-4 h-4 mr-1" /> New
          </LinkButton>
        </div>
      </div>

      {groups.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-200 shadow-none">
          <CardContent className="py-16 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium mb-1">No groups yet</p>
            <p className="text-gray-400 text-sm mb-6">Create a group to start splitting expenses</p>
            <LinkButton href="/groups/new" className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="w-4 h-4 mr-1" /> Create first group
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
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {group.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{group.name}</p>
                      {group.description && (
                        <p className="text-xs text-gray-500 truncate max-w-[180px]">{group.description}</p>
                      )}
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </CardContent>
              </Card>
            </LinkButton>
          ))}
        </div>
      )}
    </div>
  )
}
