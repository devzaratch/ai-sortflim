'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [isSuccess, setIsSuccess] = useState(false)

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage('')

        // ส่งอีเมลรีเซ็ตพาสเวิร์ดผ่าน Supabase
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/update-password`, // ลิงก์ที่จะให้กดกลับมาที่เว็บเรา
        })

        if (error) {
            setIsSuccess(false)
            setMessage(error.message)
        } else {
            setIsSuccess(true)
            setMessage('ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว กรุณาตรวจสอบกล่องข้อความ')
        }
        setLoading(false)
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-[#141218] via-[#0e0c10] to-[#1a1410] text-white flex flex-col items-center justify-center p-4 font-sans selection:bg-orange-500 selection:text-black">
            <div className="w-full max-w-md bg-[#18151f]/95 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-zinc-800/80 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent" />

                <div className="mb-6">
                    <h1 className="text-2xl font-black text-white mb-1">ลืมรหัสผ่าน</h1>
                    <p className="text-xs text-zinc-400">กรอกอีเมลของคุณเพื่อรับลิงก์ตั้งรหัสผ่านใหม่</p>
                </div>

                <form onSubmit={handleReset} className="flex flex-col gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-300">อีเมล (Email)</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-[#110f17] rounded-xl border border-zinc-800 text-white text-sm focus:outline-none focus:border-orange-500 transition placeholder:text-zinc-600"
                            placeholder="name@example.com"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 mt-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-zinc-950 font-black rounded-xl transition shadow-lg shadow-orange-500/25 text-sm tracking-wide disabled:opacity-50"
                    >
                        {loading ? 'กำลังส่งข้อมูล...' : 'ส่งลิงก์รีเซ็ตรหัสผ่าน'}
                    </button>
                </form>

                {message && (
                    <div className={`mt-4 p-3 rounded-xl text-xs font-medium text-center border ${isSuccess ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {message}
                    </div>
                )}

                <div className="mt-6 pt-5 border-t border-zinc-800/80 text-center">
                    <Link href="/login" className="text-xs text-orange-400 hover:underline font-bold">
                        ← กลับไปหน้าเข้าสู่ระบบ
                    </Link>
                </div>
            </div>
        </main>
    )
}