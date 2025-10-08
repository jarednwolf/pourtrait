'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'
import { consumePostAuthIntent, navigateForIntent } from '@/lib/auth/intent'

interface SignUpDialogProps {
	openExternally?: boolean
}

export function SignUpDialog({ openExternally = false }: SignUpDialogProps) {
	const [open, setOpen] = useState<boolean>(openExternally)

	useEffect(() => {
		const onOpen = () => setOpen(true)
		window.addEventListener('open-signup-dialog', onOpen as any)
		return () => window.removeEventListener('open-signup-dialog', onOpen as any)
	}, [])

	useEffect(() => {
		if (!open) {return}
		document.body.style.overflow = 'hidden'
		return () => { document.body.style.overflow = '' }
	}, [open])

	async function signInWithProvider(provider: 'google'|'apple') {
		await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined } })
	}

	async function signInWithEmail(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
		const form = e.currentTarget
		const data = new FormData(form)
		const email = String(data.get('email') || '')
		if (!email) { return }
		await supabase.auth.signInWithOtp({ email })
		setOpen(false)
	}

	// Handle post-auth intent when returning from auth
	useEffect(() => {
		const hash = typeof window !== 'undefined' ? window.location.hash : ''
		if (hash.includes('access_token') || hash.includes('type=recovery')) {
			const intent = consumePostAuthIntent()
			if (intent) { navigateForIntent(intent) }
		}
	}, [])

	if (!open) { return null }

	const modal = (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden="true" />
			<div role="dialog" aria-modal="true" className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-200 dark:bg-dark-surface dark:ring-gray-800">
				<h2 className="text-xl font-semibold">Create your free account</h2>
				<p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Save your taste profile, cellar, and get personalized picks in under a minute.</p>
				<div className="mt-4 grid gap-2">
					<button className="btn bg-primary text-white h-10 rounded-lg" onClick={() => signInWithProvider('google')}>Continue with Google</button>
					<button className="btn bg-black text-white h-10 rounded-lg" onClick={() => signInWithProvider('apple')}>Continue with Apple</button>
					<div className="relative my-2 text-center text-xs text-gray-500">
						<span className="bg-white px-2 dark:bg-dark-surface">or</span>
						<div className="absolute inset-0 top-1/2 -z-10 border-t border-gray-200 dark:border-gray-800" aria-hidden="true" />
					</div>
					<form onSubmit={signInWithEmail} className="grid gap-2">
						<input type="email" name="email" required placeholder="you@example.com" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:bg-dark-surface dark:border-gray-700" aria-label="Email address" />
						<button className="btn bg-primary text-white h-10 rounded-lg" type="submit">Send magic link</button>
					</form>
					<p className="mt-2 text-xs text-gray-500">By continuing, you agree to our terms and privacy policy.</p>
				</div>
				<button onClick={() => setOpen(false)} className="absolute right-3 top-3 text-gray-500 hover:text-gray-700" aria-label="Close">×</button>
			</div>
		</div>
	)

	return typeof document !== 'undefined' ? createPortal(modal, document.body) : null
}


