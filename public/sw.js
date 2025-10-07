// Preview-mode service worker killer: unregister and clear caches.
// This file is used when PWA is disabled (e.g., VERCEL_ENV=preview).
// In production, next-pwa will overwrite this file with the real SW.

self.addEventListener('install', event => {
	self.skipWaiting();
});

self.addEventListener('activate', event => {
	event.waitUntil((async () => {
		try {
			const keys = await caches.keys();
			await Promise.all(keys.map(k => caches.delete(k)));
			await self.registration.unregister();
			const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
			clients.forEach(client => {
				client.navigate(client.url);
			});
		} catch (e) {
			// no-op
		}
	})());
});
