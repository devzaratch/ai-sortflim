'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import LogoIcon from '@/components/LogoIcon'
import { Heart, Sparkles } from 'lucide-react'

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
    { href: '/movies?genre=ครอบครัว', label: 'ครอบครัว', type: 'genre' as const, value: 'ครอบครัว' },
    { href: '/movies?genre=วาย', label: 'วาย', type: 'genre' as const, value: 'วาย' },
    { href: '/movies?genre=แฟนตาซี', label: 'แฟนตาซี', type: 'genre' as const, value: 'แฟนตาซี' },
    { href: '/movies?genre=ย้อนยุค', label: 'ย้อนยุค', type: 'genre' as const, value: 'ย้อนยุค' },
    { href: '/movies?status=completed', label: 'จบแล้ว', type: 'status' as const, value: 'completed' },
]

export default function Header({ isHome = false, activeGenre, activeStatus, onNavigate }: HeaderProps) {
    const [user, setUser] = useState<User | null>(null)
    const [displayName, setDisplayName] = useState('')
    const [isVip, setIsVip] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const router = useRouter()

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

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        const term = searchTerm.trim()
        if (!term) return
        onNavigate?.()
        router.push(`/movies?search=${encodeURIComponent(term)}`)
    }

    return (
        <header className="sticky top-0 z-50 bg-[#0a0a0b]/85 backdrop-blur-xl border-b border-white/[0.07] px-4 lg:px-12 py-3 flex flex-col gap-2.5">
            {/* แถวบน: โลโก้ + ค้นหา + ของฉัน */}
            <div className="flex items-center gap-3">
                <Link
                    href="/"
                    onClick={onNavigate}
                    className="text-2xl font-black tracking-tighter text-white flex items-center gap-2 shrink-0"
                >
                    <LogoIcon className="w-9 h-9 shrink-0 drop-shadow-[0_0_14px_rgba(245,158,11,0.4)]" />
                    <span>
                        <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">MOVIES</span>
                        <span className="text-amber-400 ml-1">AI</span>
                    </span>
                </Link>

                {/* แถบค้นหาแบบ pill ตรงกลาง */}
                <form onSubmit={handleSearch} className="flex-1 min-w-0 flex items-center">
                    <label className="flex items-center gap-2.5 w-full min-w-0 bg-[#121214] border border-white/[0.07] rounded-full px-4 py-2.5 cursor-text hover:border-amber-500/35 focus-within:border-amber-500/60 focus-within:ring-1 focus-within:ring-amber-500/40 transition">
                        <span className="w-5 h-5 rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center justify-center shrink-0">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                        </span>
                        <input
                            id="site-search"
                            type="search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="ค้นหาชื่อเรื่อง แนว ฯลฯ…"
                            enterKeyHint="search"
                            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none min-w-0"
                        />
                    </label>
                </form>

                {/* ปุ่มเรื่องที่เก็บไว้ */}
                <Link
                    href="/movies?saved=1"
                    onClick={onNavigate}
                    title="เรื่องที่เก็บไว้"
                    className="w-11 h-11 rounded-full bg-[#121214] border border-white/[0.07] flex items-center justify-center text-zinc-300 hover:text-amber-400 hover:border-amber-500/40 hover:bg-[#18181b] transition shrink-0 active:scale-90"
                >
                    <Heart className="w-4.5 h-4.5" />
                </Link>

                {user ? (
                    <div className="hidden sm:flex items-center gap-3 bg-[#121214] border border-white/[0.07] px-3.5 py-1.5 rounded-full shrink-0">
                        <span className="text-xs text-zinc-200 font-bold truncate max-w-28">
                            {displayName}
                            {isVip && (
                                <span className="text-amber-400 font-extrabold ml-1 px-1.5 py-0.5 bg-amber-500/10 rounded border border-amber-500/20 text-[10px]">
                                    VIP
                                </span>
                            )}
                        </span>
                        <button
                            onClick={handleLogout}
                            className="text-xs text-zinc-400 hover:text-white bg-white/[0.06] hover:bg-white/[0.1] px-3 py-1 rounded-full transition font-medium"
                        >
                            ออก
                        </button>
                    </div>
                ) : (
                    <Link
                        href="/login"
                        onClick={onNavigate}
                        className="hidden sm:block text-xs bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#1c1917] font-bold px-4 py-2 rounded-full transition shadow-[0_4px_20px_rgba(245,158,11,0.35)] hover:-translate-y-px tracking-wide shrink-0"
                    >
                        เข้าสู่ระบบ
                    </Link>
                )}
            </div>

            {/* แถวล่าง (จอใหญ่เท่านั้น): เมนูหมวดหมู่แบบชิป */}
            <nav className="hidden md:flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {NAV_LINKS.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        onClick={onNavigate}
                        className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition ${
                            isActive(link)
                                ? 'bg-amber-500 text-[#1c1917] font-black'
                                : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                        }`}
                    >
                        {link.label}
                    </Link>
                ))}
            </nav>
        </header>
    )
}
