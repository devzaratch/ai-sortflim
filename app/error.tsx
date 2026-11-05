'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="min-h-screen bg-[#0b0b0d] text-white flex flex-col items-center justify-center text-center px-6 space-y-5">
            <p className="text-5xl">⚠️</p>
            <h1 className="text-xl font-black">เกิดข้อผิดพลาดบางอย่าง</h1>
            <p className="text-xs text-zinc-400 max-w-md leading-relaxed">
                ขออภัย ระบบไม่สามารถแสดงหน้านี้ได้ในขณะนี้ ลองใหม่อีกครั้งหรือกลับไปที่หน้าแรก
            </p>
            <div className="flex items-center gap-3">
                <button
                    onClick={reset}
                    className="bg-orange-500 hover:bg-orange-400 text-white font-extrabold px-5 py-2.5 rounded-xl transition text-xs shadow-lg shadow-orange-500/25"
                >
                    ลองอีกครั้ง
                </button>
                <Link
                    href="/"
                    className="bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 font-bold px-5 py-2.5 rounded-xl transition text-xs border border-zinc-700/60"
                >
                    กลับหน้าแรก
                </Link>
            </div>
        </div>
    )
}
