'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Receipt, LogOut, Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import type { Profile } from '@/lib/types'

export function TopNav({ profile }: { profile: Profile | null }) {
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = profile?.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?'

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center">
            <Receipt className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">SplitFree</span>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="focus:outline-none" aria-label="User menu">
                <Avatar className="w-8 h-8 cursor-pointer">
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-gray-900 truncate">{profile?.full_name ?? 'User'}</p>
              <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              render={<Link href="/settings" className="flex items-center gap-2 w-full" />}
            >
              <Settings className="w-4 h-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={signOut} className="flex items-center gap-2 text-red-600 cursor-pointer">
              <LogOut className="w-4 h-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
