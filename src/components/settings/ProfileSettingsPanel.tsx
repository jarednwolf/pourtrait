'use client'

import React from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { useAuth } from '@/hooks/useAuth'
import { AuthService } from '@/lib/auth'
import { useRouter } from 'next/navigation'

export function ProfileSettingsPanel() {
  const { user, refreshProfile, signOut } = useAuth()
  const [name, setName] = React.useState<string>('')
  const [experience, setExperience] = React.useState<'beginner' | 'intermediate' | 'advanced'>('beginner')
  const [saving, setSaving] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const router = useRouter()

  // Initialize from current profile
  React.useEffect(() => {
    if (!user?.profile) { return }
    setName(user.profile.name || '')
    setExperience((user.profile.experience_level as any) || 'beginner')
  }, [user?.profile?.name, user?.profile?.experience_level])

  const onSave = async () => {
    if (!user) { return }
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      await AuthService.updateUserProfile(user.id, {
        name,
        experienceLevel: experience
      })
      await refreshProfile().catch(() => {})
      setMessage('Profile updated')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Profile Settings</h2>
      <div className="mb-5 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          {user ? (
            <span>Signed in as <span className="font-medium">{user.email}</span></span>
          ) : (
            <span>Not signed in</span>
          )}
        </div>
        {user ? (
          <Button
            variant="outline"
            onClick={async () => { try { await signOut(); router.push('/auth/signin') } catch {} }}
          >
            Sign out
          </Button>
        ) : (
          <Button asChild>
            <a href="/auth/signin">Sign in</a>
          </Button>
        )}
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Display name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Your name"
          />
        </div>

        <div>
          <div className="block text-sm font-medium mb-2">Experience level</div>
          <div className="flex gap-4 text-sm">
            {(['beginner','intermediate','advanced'] as const).map(level => (
              <label key={level} className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="experience"
                  value={level}
                  checked={experience === level}
                  onChange={() => setExperience(level)}
                />
                <span className="capitalize">{level}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={onSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
          <Button asChild variant="outline">
            <a href="/onboarding/step1">Recalibrate taste profile</a>
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default ProfileSettingsPanel


