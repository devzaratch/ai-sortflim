import Link from 'next/link'
import { WifiOff } from 'lucide-react'

/**
 * หน้า fallback เมื่อออฟไลน์ — service worker จะโชว์หน้านี้แทนเมื่อโหลดหน้าอื่นไม่ได้
 * (เช็คการเชื่อมต่อแบบจริงต้องทำฝั่ง client — แต่หน้านี้ static พอ)
 */
export default function OfflinePage() {
    return (
        <main className="min-h-screen bg-[#0b0b0d] text-white flex flex-col items-center justify-center px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center mb-6">
                <WifiOff className="w-7 h-7 text-amber-400" aria-hidden="true" />
            </div>

            <h1 className="text-2xl font-black tracking-tight">ไม่มีอินเทอร์เน็ต</h1>
            <p className="text-xs text-zinc-400 mt-3 max-w-xs leading-relaxed">
                กำลังออฟไลน์อยู่ตอนนี้ — เชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่อีกครั้ง
                เรื่องที่เปิดค้างไว้จะยังอยู่ครบเมื่อกลับมาออนไลน์
            </p>

            <Link
                href="/"
                className="mt-8 bg-gradient-to-r from-amber-400 to-amber-500 text-[#1c1917] font-extrabold px-7 py-3 rounded-full min-h-11 flex items-center active:scale-95 transition text-sm"
            >
                ลองอีกครั้ง
            </Link>
        </main>
    )
}
