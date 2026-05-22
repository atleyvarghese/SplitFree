'use client'

import { Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { LinkButton } from '@/components/ui/link-button'
import { ArrowLeft } from 'lucide-react'

interface Props {
  group: { id: string; name: string; description: string | null; default_currency: string }
  memberCount: number
}

export function GroupHeader({ group, memberCount }: Props) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <LinkButton href="/groups" variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4" />
        </LinkButton>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{group.name}</h1>
          {group.description && (
            <p className="text-sm text-gray-500 truncate">{group.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
          <Users className="w-3.5 h-3.5" />
          <span>{memberCount}</span>
          <Badge variant="outline" className="ml-1 text-xs px-1.5 py-0">{group.default_currency}</Badge>
        </div>
      </div>
    </div>
  )
}
