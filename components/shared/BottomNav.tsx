'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Activity, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/groups', label: 'Groups', icon: Users },
  { href: '/activity', label: 'Activity', icon: Activity },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 safe-area-pb">
      <div className="max-w-2xl mx-auto flex">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors',
                active ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon className={cn('w-5 h-5', active && 'fill-indigo-100')} />
              <span className={cn('font-medium', active && 'text-indigo-600')}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
