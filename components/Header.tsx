'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface HeaderProps {
    /** หน้าแรก active อยู่หรือไม่ */
    isHome?: boolean
    /** แนวที่กำลังกรองอยู่ (ใช้ไฮไลต์เมนู) */
    activeGenre?: string | null
    /** สถานะที่กำลังกรองอยู่ เช่น 'completed' */
    activeStatus?: string | null
    /** เรียกก่อนเปลี่ยนหน้า (เช่น หน้าดูวิดีโอต้องหยุดเสียงก่อนออก) */
    onNavigate?: () => void
}

const NAV_LINKS = [
    { href: '/', label: 'หน้าแรก', type: 'home' as const },
    { href: '/movies', label: 'ทั้งหมด', type: 'all' as const },
    { href: '/movies?genre=ดราม่า', label: 'ดราม่า', type: 'genre' as const, value: 'ดราม่า' },
    { href: '/movies?genre=โรแมนติก', label: 'โรแมนติก', type: 'genre' as const, value: 'โรแมนติก' },
    { href: '/movies?genre=ย้อนยุค', label: 'ย้อนยุค', type: 'genre' as const, value: 'ย้อนยุค' },
    { href: '/movies?genre=วาย', label: 'วาย', type: 'genre' as const, value: 'วาย' },
    { href: '/movies?status=completed', label: 'จบแล้ว', type: 'status' as const, value: 'completed' },
]

export default function Header({ isHome = false, activeGenre, activeStatus, onNavigate }: HeaderProps) {
    const [user, setUser] = useState<User | null>(null)
    const [displayName, setDisplayName] = useState('')
    const [isVip, setIsVip] = useState(false)

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (cancelled) return
            setUser(user)

            if (!user) {
                setDisplayName('')
                setIsVip(false)
                return
            }

            const [{ data: profile }, { data: subscription }] = await Promise.all([
                supabase.from('profiles').select('username').eq('id', user.id).maybeSingle(),
                supabase.from('subscriptions').select('status').eq('user_id', user.id).maybeSingle(),
            ])

            if (cancelled) return
            setDisplayName(profile?.username || user.user_metadata?.username || user.email || '')
            setIsVip(subscription?.status === 'active')
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

    const handleLogout = async () => {
        await supabase.auth.signOut()
        setUser(null)
        setDisplayName('')
        setIsVip(false)
    }

    const isActive = (link: (typeof NAV_LINKS)[number]) => {
        if (link.type === 'home') return isHome
        if (link.type === 'all') return !isHome && !activeGenre && activeStatus !== 'completed'
        if (link.type === 'genre') return activeGenre === link.value
        if (link.type === 'status') return activeStatus === link.value
        return false
    }

    return (
        <header className="sticky top-0 z-50 bg-[#0b0b0d]/90 backdrop-blur-xl border-b border-zinc-800/60 px-4 lg:px-12 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-8">
                <Link
                    href="/"
                    onClick={onNavigate}
                    className="text-2xl font-black tracking-tighter text-white flex items-center gap-1.5"
                >
                    <span className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">MOVIES</span>
                    <span className="bg-orange-500 text-zinc-950 px-2 py-0.5 rounded-lg text-xs font-black tracking-normal shadow-lg shadow-orange-500/20">AI</span>
                </Link>

                <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-zinc-300">
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={onNavigate}
                            className={`transition ${isActive(link) ? 'text-orange-400 font-black' : 'hover:text-orange-400'}`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="flex items-center gap-4">
                {user ? (
                    <div className="flex items-center gap-3 bg-zinc-900/80 border border-zinc-800 px-3.5 py-1.5 rounded-full">
                        <span className="text-xs text-zinc-300 hidden sm:inline font-bold">
                            👤 {displayName}{' '}
                            {isVip && (
                                <span className="text-amber-400 font-extrabold ml-1 px-1.5 py-0.5 bg-amber-500/10 rounded border border-amber-500/20 text-[10px]">
                                    VIP
                                </span>
                            )}
                        </span>
                        <button
                            onClick={handleLogout}
                            className="text-xs text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded-full transition font-medium"
                        >
                            ออกจากระบบ
                        </button>
                    </div>
                ) : (
                    <Link
                        href="/login"
                        onClick={onNavigate}
                        className="text-xs bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 font-bold px-4.5 py-2 rounded-xl transition text-zinc-950 shadow-lg shadow-orange-500/25 tracking-wide"
                    >
                        เข้าสู่ระบบ
                    </Link>
                )}
            </div>
        </header>
    )
}
