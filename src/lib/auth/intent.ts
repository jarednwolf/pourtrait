'use client'

export type PostAuthActionType = 'chat' | 'scanner' | 'import' | 'pairing'

export interface PostAuthAction {
	type: PostAuthActionType
	params?: Record<string, string>
}

const STORAGE_KEY = 'postAuthIntent'

export function savePostAuthIntent(action: PostAuthAction): void {
	try {
		if (typeof window === 'undefined') {return}
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify(action))
	} catch {}
}

export function consumePostAuthIntent(): PostAuthAction | null {
	try {
		if (typeof window === 'undefined') {return null}
		const raw = sessionStorage.getItem(STORAGE_KEY)
		if (!raw) {return null}
		sessionStorage.removeItem(STORAGE_KEY)
		return JSON.parse(raw) as PostAuthAction
	} catch {
		return null
	}
}

export function buildUrlForIntent(intent: PostAuthAction): string {
	switch (intent.type) {
		case 'chat': {
			const q = intent.params?.q || "What's your top pick for tonight?"
			return `/chat?q=${encodeURIComponent(q)}&send=1`
		}
		case 'scanner': {
			const demo = intent.params?.demo || '1'
			return `/restaurant-scanner?demo=${encodeURIComponent(demo)}`
		}
		case 'import': {
			const source = intent.params?.source || 'home'
			return `/import?source=${encodeURIComponent(source)}`
		}
		case 'pairing': {
			const food = intent.params?.food || 'steak'
			return `/chat?q=${encodeURIComponent('What pairs with ' + food + '?')}&send=1`
		}
		default:
			return '/'
	}
}

export function navigateForIntent(intent: PostAuthAction): void {
	try {
		const url = buildUrlForIntent(intent)
		window.location.assign(url)
	} catch {}
}


