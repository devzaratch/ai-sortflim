'use client'

import { useEffect } from 'react'

/**
 * ลงทะเบียน service worker (/sw.js) — production เท่านั้น
 * (dev ไม่ลงทะเบียนกัน SW แคชโค้ดเก่าตอนแก้ไข)
 */
export default function ServiceWorkerRegister() {
    useEffect(() => {
        if (process.env.NODE_ENV !== 'production') return
        if (!('serviceWorker' in navigator)) return

        navigator.serviceWorker.register('/sw.js').catch((err) => {
            console.error('Service worker register failed:', err)
        })
    }, [])

    return null
}
