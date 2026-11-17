/**
 * Service Worker ของ MOVIES AI — เรียบง่ายและปลอดภัย
 * - หน้า (navigation): พยายามเรียก network ก่อนเสมอ (เนื้อหาสด) — ออฟไลน์ค่อยโชว์ /offline
 * - static assets ที่ immutable (/_next/static, /icons): cache-first
 * - Supabase/API/origin อื่น: ไม่แตะ (ปล่อยให้ browser จัดการ)
 */
const CACHE = 'moviesai-v1'
const OFFLINE_URL = '/offline'

self.addEventListener('install', (event) => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE)
            await cache.addAll([OFFLINE_URL])
            await self.skipWaiting()
        })()
    )
})

self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            const keys = await caches.keys()
            await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
            await self.clients.claim()
        })()
    )
})

self.addEventListener('fetch', (event) => {
    const { request } = event
    if (request.method !== 'GET') return

    const url = new URL(request.url)
    if (url.origin !== self.location.origin) return
    if (url.pathname.startsWith('/api/')) return

    // หน้าเว็บ: network-first + offline fallback
    if (request.mode === 'navigate') {
        event.respondWith(
            (async () => {
                try {
                    return await fetch(request)
                } catch {
                    const cache = await caches.open(CACHE)
                    const offline = await cache.match(OFFLINE_URL)
                    return offline ?? Response.error()
                }
            })()
        )
        return
    }

    // static assets immutable: cache-first
    if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
        event.respondWith(
            (async () => {
                const cache = await caches.open(CACHE)
                const hit = await cache.match(request)
                if (hit) return hit
                const res = await fetch(request)
                if (res && res.ok) cache.put(request, res.clone())
                return res
            })()
        )
    }
})
