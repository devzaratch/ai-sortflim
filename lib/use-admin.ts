'use client'

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

export type AdminGateStatus = 'loading' | 'anon' | 'forbidden' | 'admin'

interface AdminGateState {
    status: AdminGateStatus
    user: User | null
    displayName: string
}

/**
 * ตรวจสิทธิ์แอดมินฝั่ง client (ใช้กับหน้า /admin และ /upload)
 *
 * หมายเหตุความปลอดภัย: การกันจริงอยู่ที่ RLS ใน supabase/schema.sql
 * (เฉพาะ role = 'admin' เขียน movies/episodes ได้) — hook นี้เป็น UX guard
 * เพื่อไม่ให้ผู้ใช้ทั่วไปเห็นฟอร์ม/ข้อมูลที่ไม่ควรเห็น
 */
export function useAdminGate(): AdminGateState {
    const [status, setStatus] = useState<AdminGateStatus>('loading')
    const [user, setUser] = useState<User | null>(null)
    const [displayName, setDisplayName] = useState('')

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (cancelled) return

            setUser(user)

            if (!user) {
                setDisplayName('')
                setStatus('anon')
                return
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role, username')
                .eq('id', user.id)
                .maybeSingle()

            if (cancelled) return

            setDisplayName(profile?.username || user.email || '')
            setStatus(profile?.role === 'admin' ? 'admin' : 'forbidden')
        }

        load()

        const { data: listener } = supabase.auth.onAuthStateChange(() => {
            load()
        })

        return () => {
            cancelled = true
            listener.subscription.unsubscribe()
        }
    }, [])

    return { status, user, displayName }
}
