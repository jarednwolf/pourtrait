'use client'

import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { savePostAuthIntent, type PostAuthAction } from '@/lib/auth/intent'

interface AuthGateProps {
	action?: PostAuthAction
	children: React.ReactNode
}

export function AuthGate({ action, children }: AuthGateProps) {
	const { user } = useAuth()

	if (user) {
		return <>{children}</>
	}

	const handleClick: React.MouseEventHandler = (e) => {
		try {
			// Prevent navigation for anonymous users and open signup flow
			e.preventDefault()
			e.stopPropagation()
			if (action) { savePostAuthIntent(action) }
			// Open signup dialog via custom event; SignUpDialog should listen
			window.dispatchEvent(new CustomEvent('open-signup-dialog'))
		} catch {}
	}

	return (
		<span onClick={handleClick} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { (handleClick as any)(e) } }}>
			{children}
		</span>
	)
}


