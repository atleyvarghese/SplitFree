'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Loader2, User, Shield, LogOut } from 'lucide-react'
import { getInitials } from '@/lib/utils/format'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<{ full_name: string; email: string } | null>(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setProfile(data)
        setName(data.full_name ?? '')
      }
    }
    load()
  }, [])

  async function saveName() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    const { error } = await supabase.from('profiles').update({ full_name: name }).eq('id', user.id)
    setSaving(false)
    if (error) toast.error('Failed to update name')
    else toast.success('Name updated!')
  }

  async function changePassword() {
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return }
    setChangingPassword(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setChangingPassword(false)
    if (error) toast.error(error.message)
    else {
      toast.success('Password updated!')
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Settings</h1>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-14 h-14">
              <AvatarFallback className="bg-indigo-100 text-indigo-700 text-lg font-semibold">
                {getInitials(profile?.full_name ?? profile?.email)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-gray-900">{profile?.full_name ?? 'Your name'}</p>
              <p className="text-sm text-gray-500">{profile?.email}</p>
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <div className="flex gap-2">
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
              />
              <Button onClick={saveName} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 flex-shrink-0">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4" /> Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newpw">New password</Label>
            <Input
              id="newpw"
              type="password"
              placeholder="Min. 8 characters"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmpw">Confirm password</Label>
            <Input
              id="confirmpw"
              type="password"
              placeholder="Repeat new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button
            onClick={changePassword}
            disabled={changingPassword || !newPassword}
            variant="outline"
            className="w-full"
          >
            {changingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Change password
          </Button>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm border-red-100">
        <CardContent className="pt-5">
          <Button
            variant="outline"
            className="w-full text-red-600 border-red-200 hover:bg-red-50"
            onClick={signOut}
          >
            <LogOut className="w-4 h-4 mr-2" /> Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
