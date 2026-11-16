'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { LogIn, ShieldAlert } from 'lucide-react'
import { useAdminGate } from '@/lib/use-admin'

/**
 * ครอบหน้าที่ต้องการสิทธิ์แอดมิน (/admin, /upload)
 * - ยังไม่ล็อกอิน → ชวนเข้าสู่ระบบ
 * - ล็อกอินแล้วแต่ไม่ใช่แอดมิน → แจ้งไม่มีสิทธิ์
 * - เป็นแอดมิน → แสดงเนื้อหา
 *
 * การป้องกันระดับข้อมูลจริงอยู่ที่ RLS (supabase/schema.sql)
 */
export default function AdminGate({ children }: { children: ReactNode }) {
    const { status } = useAdminGate()

    if (status === 'loading') {
        return (
            <div className="min-h-[50vh] flex items-center justify-center px-4">
                <div className="flex items-center gap-3 text-zinc-400">
                    <span className="w-6 h-6 border-2 border-zinc-700 border-t-amber-500 rounded-full animate-spin" aria-hidden="true" />
                    <span className="text-sm font-bold">กำลังตรวจสอบสิทธิ์…</span>
                </div>
            </div>
        )
    }

    if (status === 'anon') {
        return (
            <div className="min-h-[50vh] flex items-center justify-center px-4">
                <div className="w-full max-w-sm text-center space-y-5 bg-[#121214] border border-white/[0.07] rounded-3xl p-8">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center">
                        <LogIn className="w-7 h-7 text-amber-400" aria-hidden="true" />
                    </div>
                    <div className="space-y-1.5">
                        <h1 className="text-lg font-black text-white">ต้องเข้าสู่ระบบก่อน</h1>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            หน้านี้สำหรับแอดมินเท่านั้น กรุณาเข้าสู่ระบบด้วยบัญชีที่มีสิทธิ์
                        </p>
                    </div>
                    <Link
                        href="/login"
                        className="block w-full min-h-11 flex items-center justify-center rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-[#1c1917] font-extrabold text-sm active:scale-95 transition"
                    >
                        เข้าสู่ระบบ
                    </Link>
                    <Link href="/" className="block text-xs text-zinc-500 hover:text-amber-400 font-bold transition">
                        ← กลับหน้าแรก
                    </Link>
                </div>
            </div>
        )
    }

    if (status === 'forbidden') {
        return (
            <div className="min-h-[50vh] flex items-center justify-center px-4">
                <div className="w-full max-w-sm text-center space-y-5 bg-[#121214] border border-white/[0.07] rounded-3xl p-8">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/15 border border-rose-500/35 flex items-center justify-center">
                        <ShieldAlert className="w-7 h-7 text-rose-400" aria-hidden="true" />
                    </div>
                    <div className="space-y-1.5">
                        <h1 className="text-lg font-black text-white">ไม่มีสิทธิ์เข้าถึง</h1>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            บัญชีนี้ไม่ใช่แอดมิน หากต้องการสิทธิ์ กรุณาติดต่อผู้ดูแลระบบ
                        </p>
                    </div>
                    <Link
                        href="/"
                        className="block w-full min-h-11 flex items-center justify-center rounded-xl bg-white/[0.06] border border-white/[0.09] text-zinc-200 font-bold text-sm active:scale-95 transition"
                    >
                        กลับหน้าแรก
                    </Link>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
