'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { track } from '@/lib/utils/track'

export function PushOptInBanner() {
  const { isSupported, permission, isSubscribed, subscribe, requestPermission } = usePushNotifications()
  const [dismissed, setDismissed] = useState(false)

  const enabled = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS === 'true' : false

  // Only show when enabled, supported, not subscribed, and not dismissed
  const shouldShow = useMemo(() => {
    return enabled && isSupported && !isSubscribed && !dismissed && permission !== 'granted'
  }, [enabled, isSupported, isSubscribed, dismissed, permission])

  useEffect(() => {
    if (shouldShow) {
      track('notifications_prompt_shown')
    }
  }, [shouldShow])

  if (!shouldShow) {return null}

  const handleAccept = async () => {
    track('notifications_optin_accept')
    const ok = await subscribe()
    if (!ok) {
      // fallback to request permission only
      await requestPermission()
    }
    setDismissed(true)
  }

  const handleDeny = () => {
    track('notifications_optin_deny')
    setDismissed(true)
  }

  return (
    <div className="sticky top-0 z-40" role="region" aria-labelledby="push-optin-title" aria-live="polite">
      <Card className="mx-auto mt-2 max-w-6xl border-amber-300 bg-amber-50">
        <div className="p-3 flex items-start gap-3">
          <Icon name="bell" className="h-5 w-5 text-amber-700 mt-0.5" aria-hidden />
          <div className="flex-1">
            <div className="font-medium text-amber-900" id="push-optin-title">Enable alerts for ready-to-drink bottles</div>
            <div className="text-sm text-amber-800" id="push-optin-desc">Get gentle reminders when wines hit their peak and important updates about your cellar.</div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAccept} aria-describedby="push-optin-desc">Enable</Button>
            <Button size="sm" variant="outline" onClick={handleDeny}
              aria-label="Dismiss notifications opt-in"
            >Not now</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}


