import type { Metadata } from 'next'
import Link from 'next/link'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
    title: 'ไม่พบหน้าที่คุณต้องการ',
    robots: { index: false, follow: false },
}

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#0b0b0d] text-white font-sans flex flex-col justify-between">
            <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 space-y-5">
                <p className="text-6xl font-black bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">404</p>
                <h1 className="text-xl md:text-2xl font-black">ไม่พบหน้าที่คุณต้องการ</h1>
                <p className="text-xs text-zinc-400 max-w-md leading-relaxed">
                    ลิงก์อาจถูกเปลี่ยนหรือหน้านี้อาจถูกนำออกแล้ว ลองกลับไปเลือกดูละคร AI จากหน้าแรกอีกครั้ง
                </p>
                <div className="flex items-center gap-3 pt-2">
                    <Link
                        href="/"
                        className="bg-orange-500 hover:bg-orange-400 text-white font-extrabold px-5 py-2.5 rounded-xl transition text-xs shadow-lg shadow-orange-500/25"
                    >
                        กลับหน้าแรก
                    </Link>
                    <Link
                        href="/movies"
                        className="bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 font-bold px-5 py-2.5 rounded-xl transition text-xs border border-zinc-700/60"
                    >
                        ดูละครทั้งหมด
                    </Link>
                </div>
            </main>
            <Footer />
        </div>
    )
}
