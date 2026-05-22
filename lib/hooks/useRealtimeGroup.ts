'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRealtimeGroup(groupId: string, onUpdate: () => void) {
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`group:${groupId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `group_id=eq.${groupId}` }, onUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expense_splits' }, onUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settlements', filter: `group_id=eq.${groupId}` }, onUpdate)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [groupId, onUpdate])
}
