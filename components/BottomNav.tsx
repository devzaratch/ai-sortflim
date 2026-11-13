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
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-[#0c0c0e]/90 backdrop-blur-xl border-t border-white/[0.07] flex items-stretch justify-around pb-[max(8px,env(safe-area-inset-bottom))] pt-1.5">
            <Link
                href="/"
                className={`flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-w-14 transition ${
                    pathname === '/' ? 'text-amber-400' : 'text-zinc-400 hover:text-zinc-200'
                }`}
            >
                <Home className="w-5 h-5" />
                <span className={`text-[10px] ${pathname === '/' ? 'font-black' : 'font-bold'}`}>หน้าแรก</span>
            </Link>

            <Link
                href="/movies"
                className={`flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-w-14 transition ${
                    pathname === '/movies' && !savedActive ? 'text-amber-400' : 'text-zinc-400 hover:text-zinc-200'
                }`}
            >
                <LayoutGrid className="w-5 h-5" />
                <span className={`text-[10px] ${pathname === '/movies' && !savedActive ? 'font-black' : 'font-bold'}`}>ทั้งหมด</span>
            </Link>

            <button
                onClick={focusSearch}
                className="flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-w-14 text-zinc-400 hover:text-zinc-200 transition"
            >
                <Search className="w-5 h-5" />
                <span className="text-[10px] font-bold">ค้นหา</span>
            </button>

            <Link
                href="/movies?saved=1"
                className={`flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-w-14 transition ${
                    savedActive ? 'text-amber-400' : 'text-zinc-400 hover:text-zinc-200'
                }`}
            >
                <Heart className="w-5 h-5" />
                <span className={`text-[10px] ${savedActive ? 'font-black' : 'font-bold'}`}>เก็บไว้</span>
            </Link>

            <Link
                href="/#continue"
                className="flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-w-14 text-zinc-400 hover:text-zinc-200 transition"
            >
                <History className="w-5 h-5" />
                <span className="text-[10px] font-bold">ประวัติ</span>
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
