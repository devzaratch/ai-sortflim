'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Home, LayoutGrid, Search, Heart, History, LogIn, UserRound, LogOut, Crown, X } from 'lucide-react'

/**
 * แถบเมนูนำทางด้านล่าง (มือถือเท่านั้น) — ติดหน้าจอด้านล่างเสมอ
 * ประกอบด้วย: หน้าแรก / ทั้งหมด / ค้นหา / เก็บไว้ / บัญชี (เข้าสู่ระบบ)
 * ปุ่มบัญชี: ยังไม่ล็อกอิน → ไปหน้า /login | ล็อกอินแล้ว → เปิดชีตบัญชี (ประวัติการดู + ออกจากระบบ)
 */
function BottomNavInner() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [displayName, setDisplayName] = useState('')
    const [isVip, setIsVip] = useState(false)
    const [sheetOpen, setSheetOpen] = useState(false)
    const [vipToast, setVipToast] = useState(false)
    const savedActive = pathname === '/movies' && searchParams.get('saved') === '1'

    // ดึงสถานะล็อกอิน (เหมือน Header) — อัปเดตทันทีเมื่อ login/logout
    useEffect(() => {
        let cancelled = false

        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (cancelled) return
            setUser(user)

            if (!user) {
                setDisplayName('')
                setIsVip(false)
                setSheetOpen(false)
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

    // ปิดชีตด้วยปุ่ม Escape + ล็อกการเลื่อนพื้นหลังขณะเปิด
    useEffect(() => {
        if (!sheetOpen) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSheetOpen(false)
        }
        document.addEventListener('keydown', onKey)
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = ''
        }
    }, [sheetOpen])

    // toast VIP: ปิดเองหลัง 2.5 วินาที
    useEffect(() => {
        if (!vipToast) return
        const t = setTimeout(() => setVipToast(false), 2500)
        return () => clearTimeout(t)
    }, [vipToast])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        setUser(null)
        setDisplayName('')
        setIsVip(false)
        setSheetOpen(false)
        router.push('/')
    }

    /** ปุ่มค้นหา: โฟกัสช่องค้นหาบนหัวเว็บ (มี id="site-search" ทุกหน้า) */
    const focusSearch = () => {
        const input = document.getElementById('site-search')
        if (input instanceof HTMLInputElement) {
            input.focus()
            input.select()
        } else {
            router.push('/movies')
        }
    }

    const navItem = 'relative flex flex-1 min-w-0 flex-col items-center justify-center gap-0.5 py-1.5 min-h-[52px] rounded-2xl active:scale-90 transition'
    const navLabel = 'text-[10px] leading-none font-bold whitespace-nowrap'
    const activeBar = (
        <span aria-hidden="true" className="absolute top-0 w-6 h-0.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.7)]" />
    )
    const shortName = displayName.length > 8 ? `${displayName.slice(0, 8)}…` : displayName
    const initial = (displayName || 'U').trim().charAt(0).toUpperCase()
    const loginActive = pathname === '/login' && !user

    return (
        <>
            {/* ชีตบัญชี (มือถือ) — เปิดเมื่อกดปุ่มบัญชีขณะล็อกอินแล้ว */}
            {sheetOpen && user && (
                <div className="md:hidden">
                    <button
                        type="button"
                        aria-label="ปิดหน้าต่างบัญชี"
                        onClick={() => setSheetOpen(false)}
                        className="fixed inset-0 z-[55] bg-black/65 backdrop-blur-sm sheet-fade"
                    />
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="บัญชีของฉัน"
                        className="sheet-up fixed bottom-[calc(62px+env(safe-area-inset-bottom))] inset-x-3 z-[56] rounded-3xl bg-[#151517]/98 backdrop-blur-xl border border-white/[0.09] shadow-[0_-8px_40px_rgba(0,0,0,0.6)] p-4"
                    >
                        <div className="flex items-center gap-3 pb-3 border-b border-white/[0.07]">
                            <span className="relative w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-[#1c1917] font-black text-lg flex items-center justify-center shrink-0 shadow-[0_0_18px_rgba(245,158,11,0.35)]">
                                {initial}
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-white truncate">{displayName || 'ผู้ใช้ MOVIES AI'}</p>
                                <p className="text-[11px] text-zinc-500 truncate">{user.email}</p>
                            </div>
                            {isVip ? (
                                <span className="flex items-center gap-1 bg-amber-500/15 text-amber-300 border border-amber-500/40 text-[10px] font-black px-2 py-1 rounded-full shrink-0">
                                    <Crown className="w-3 h-3" aria-hidden="true" /> VIP
                                </span>
                            ) : (
                                <span className="bg-white/[0.06] text-zinc-400 text-[10px] font-bold px-2 py-1 rounded-full shrink-0">ฟรี</span>
                            )}
                            <button
                                type="button"
                                onClick={() => setSheetOpen(false)}
                                aria-label="ปิด"
                                className="w-9 h-9 -mr-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.08] flex items-center justify-center transition shrink-0"
                            >
                                <X className="w-4 h-4" aria-hidden="true" />
                            </button>
                        </div>

                        <Link
                            href="/#continue"
                            onClick={() => setSheetOpen(false)}
                            className="mt-2 flex items-center gap-3 min-h-12 px-3 rounded-2xl text-zinc-200 hover:bg-white/[0.05] active:scale-[0.98] transition"
                        >
                            <History className="w-5 h-5 text-amber-400 shrink-0" aria-hidden="true" />
                            <span className="text-sm font-bold">ประวัติการดู</span>
                        </Link>

                        {!isVip && (
                            <button
                                type="button"
                                onClick={() => setVipToast(true)}
                                className="mt-1 w-full flex items-center gap-3 min-h-12 px-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 active:scale-[0.98] transition"
                            >
                                <Crown className="w-5 h-5 shrink-0" aria-hidden="true" />
                                <span className="text-sm font-bold">สมัคร VIP ดูครบทุกตอน</span>
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="mt-1 w-full flex items-center gap-3 min-h-12 px-3 rounded-2xl text-red-400 hover:bg-red-500/10 active:scale-[0.98] transition"
                        >
                            <LogOut className="w-5 h-5 shrink-0" aria-hidden="true" />
                            <span className="text-sm font-bold">ออกจากระบบ</span>
                        </button>
                    </div>
                </div>
            )}

            {/* toast แจ้ง VIP ยังไม่เปิดให้สมัคร */}
            {vipToast && (
                <div
                    role="status"
                    className="sheet-up fixed bottom-[calc(76px+env(safe-area-inset-bottom))] inset-x-0 z-[57] flex justify-center pointer-events-none px-4"
                >
                    <span className="flex items-center gap-2 bg-amber-400 text-[#1c1917] text-xs font-bold px-4 py-2.5 rounded-full shadow-[0_8px_30px_rgba(245,158,11,0.4)]">
                        <Crown className="w-4 h-4" aria-hidden="true" /> VIP กำลังจะเปิดให้บริการเร็ว ๆ นี้
                    </span>
                </div>
            )}

            <nav
                aria-label="เมนูนำทางด้านล่าง"
                className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-[#0c0c0e]/92 backdrop-blur-xl border-t border-white/[0.07] flex items-stretch justify-around pt-1 pb-[max(6px,env(safe-area-inset-bottom))]"
            >
                <Link
                    href="/"
                    aria-current={pathname === '/' ? 'page' : undefined}
                    className={`${navItem} ${pathname === '/' ? 'text-amber-400' : 'text-zinc-400 hover:text-zinc-200'}`}
                >
                    <Home className="w-5 h-5" aria-hidden="true" />
                    <span className={`${navLabel} ${pathname === '/' ? 'font-black' : ''}`}>หน้าแรก</span>
                    {pathname === '/' && activeBar}
                </Link>

                <Link
                    href="/movies"
                    aria-current={pathname === '/movies' && !savedActive ? 'page' : undefined}
                    className={`${navItem} ${pathname === '/movies' && !savedActive ? 'text-amber-400' : 'text-zinc-400 hover:text-zinc-200'}`}
                >
                    <LayoutGrid className="w-5 h-5" aria-hidden="true" />
                    <span className={`${navLabel} ${pathname === '/movies' && !savedActive ? 'font-black' : ''}`}>ทั้งหมด</span>
                    {pathname === '/movies' && !savedActive && activeBar}
                </Link>

                <button
                    type="button"
                    onClick={focusSearch}
                    aria-label="ค้นหาเรื่อง"
                    className={`${navItem} text-zinc-400 hover:text-zinc-200`}
                >
                    <Search className="w-5 h-5" aria-hidden="true" />
                    <span className={navLabel}>ค้นหา</span>
                </button>

                <Link
                    href="/movies?saved=1"
                    aria-current={savedActive ? 'page' : undefined}
                    className={`${navItem} ${savedActive ? 'text-amber-400' : 'text-zinc-400 hover:text-zinc-200'}`}
                >
                    <Heart className={`w-5 h-5 ${savedActive ? 'fill-current' : ''}`} aria-hidden="true" />
                    <span className={`${navLabel} ${savedActive ? 'font-black' : ''}`}>เก็บไว้</span>
                    {savedActive && activeBar}
                </Link>

                {user ? (
                    <button
                        type="button"
                        onClick={() => setSheetOpen((v) => !v)}
                        aria-expanded={sheetOpen}
                        aria-label={`บัญชี ${displayName || 'ของฉัน'}`}
                        className={`${navItem} text-amber-400`}
                    >
                        <span className="relative">
                            <UserRound className="w-5 h-5" aria-hidden="true" />
                            {isVip && (
                                <span className="absolute -top-1 -right-2 bg-amber-400 text-[#1c1917] rounded-full p-[1px]">
                                    <Crown className="w-2 h-2" aria-hidden="true" />
                                </span>
                            )}
                        </span>
                        <span className={`${navLabel} font-black`}>{shortName || 'บัญชี'}</span>
                        {sheetOpen && (
                            <span aria-hidden="true" className="absolute top-0 w-6 h-0.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.7)]" />
                        )}
                    </button>
                ) : (
                    <Link
                        href="/login"
                        aria-current={loginActive ? 'page' : undefined}
                        className={`${navItem} ${loginActive ? 'text-amber-400' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                        <span className="relative flex items-center justify-center w-5 h-5">
                            <span className="absolute inset-0 rounded-full bg-amber-500/20 border border-amber-500/40" aria-hidden="true" />
                            <LogIn className="relative w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                        </span>
                        <span className={`${navLabel} ${loginActive ? 'font-black text-amber-400' : 'text-amber-400/90'}`}>เข้าสู่ระบบ</span>
                        {loginActive && activeBar}
                    </Link>
                )}
            </nav>
        </>
    )
}

export default function BottomNav() {
    return (
        <Suspense fallback={null}>
            <BottomNavInner />
        </Suspense>
    )
}
