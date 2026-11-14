'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Home, LayoutGrid, Search, Heart, History } from 'lucide-react'

/**
 * แถบเมนูนำทางด้านล่าง (มือถือเท่านั้น) — ติดหน้าจอด้านล่างเสมอ
 * ประกอบด้วย: หน้าแรก / ทั้งหมด / ค้นหา / เก็บไว้ / ประวัติ
 */
function BottomNavInner() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const router = useRouter()
    const savedActive = pathname === '/movies' && searchParams.get('saved') === '1'

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

    return (
        <nav
            aria-label="เมนูนำทางด้านล่าง"
            className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-[#0c0c0e]/92 backdrop-blur-xl border-t border-white/[0.07] flex items-stretch justify-around pt-1 pb-[max(6px,env(safe-area-inset-bottom))]"
        >
            <Link
                href="/"
                aria-current={pathname === '/' ? 'page' : undefined}
                className={`relative flex flex-col items-center justify-center gap-0.5 py-1.5 px-2.5 min-w-[60px] min-h-[52px] rounded-2xl active:scale-90 transition ${
                    pathname === '/' ? 'text-amber-400' : 'text-zinc-400 hover:text-zinc-200'
                }`}
            >
                <Home className="w-5 h-5" aria-hidden="true" />
                <span className={`text-[11px] ${pathname === '/' ? 'font-black' : 'font-bold'}`}>หน้าแรก</span>
                {pathname === '/' && (
                    <span aria-hidden="true" className="absolute top-0 w-6 h-0.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.7)]" />
                )}
            </Link>

            <Link
                href="/movies"
                aria-current={pathname === '/movies' && !savedActive ? 'page' : undefined}
                className={`relative flex flex-col items-center justify-center gap-0.5 py-1.5 px-2.5 min-w-[60px] min-h-[52px] rounded-2xl active:scale-90 transition ${
                    pathname === '/movies' && !savedActive ? 'text-amber-400' : 'text-zinc-400 hover:text-zinc-200'
                }`}
            >
                <LayoutGrid className="w-5 h-5" aria-hidden="true" />
                <span className={`text-[11px] ${pathname === '/movies' && !savedActive ? 'font-black' : 'font-bold'}`}>ทั้งหมด</span>
                {pathname === '/movies' && !savedActive && (
                    <span aria-hidden="true" className="absolute top-0 w-6 h-0.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.7)]" />
                )}
            </Link>

            <button
                onClick={focusSearch}
                aria-label="ค้นหาเรื่อง"
                className="flex flex-col items-center justify-center gap-0.5 py-1.5 px-2.5 min-w-[60px] min-h-[52px] rounded-2xl text-zinc-400 hover:text-zinc-200 active:scale-90 transition"
            >
                <Search className="w-5 h-5" aria-hidden="true" />
                <span className="text-[11px] font-bold">ค้นหา</span>
            </button>

            <Link
                href="/movies?saved=1"
                aria-current={savedActive ? 'page' : undefined}
                className={`relative flex flex-col items-center justify-center gap-0.5 py-1.5 px-2.5 min-w-[60px] min-h-[52px] rounded-2xl active:scale-90 transition ${
                    savedActive ? 'text-amber-400' : 'text-zinc-400 hover:text-zinc-200'
                }`}
            >
                <Heart className={`w-5 h-5 ${savedActive ? 'fill-current' : ''}`} aria-hidden="true" />
                <span className={`text-[11px] ${savedActive ? 'font-black' : 'font-bold'}`}>เก็บไว้</span>
                {savedActive && (
                    <span aria-hidden="true" className="absolute top-0 w-6 h-0.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.7)]" />
                )}
            </Link>

            <Link
                href="/#continue"
                className="flex flex-col items-center justify-center gap-0.5 py-1.5 px-2.5 min-w-[60px] min-h-[52px] rounded-2xl text-zinc-400 hover:text-zinc-200 active:scale-90 transition"
            >
                <History className="w-5 h-5" aria-hidden="true" />
                <span className="text-[11px] font-bold">ประวัติ</span>
            </Link>
        </nav>
    )
}

export default function BottomNav() {
    return (
        <Suspense fallback={null}>
            <BottomNavInner />
        </Suspense>
    )
}
