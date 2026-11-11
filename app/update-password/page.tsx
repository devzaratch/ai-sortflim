'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function UpdatePasswordPage() {
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [isSuccess, setIsSuccess] = useState(false)
    const router = useRouter()

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage('')

        const { error } = await supabase.auth.updateUser({ password })

        if (error) {
            setIsSuccess(false)
            setMessage(error.message)
        } else {
            setIsSuccess(true)
            setMessage('เปลี่ยนรหัสผ่านสำเร็จ! กำลังพาคุณไปหน้าแรก...')
            setTimeout(() => {
                router.push('/')
            }, 1500)
        }
        setLoading(false)
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-[#141218] via-[#0e0c10] to-[#1a1410] text-white flex flex-col items-center justify-center p-4 font-sans selection:bg-amber-500 selection:text-black">
            <div className="w-full max-w-md bg-[#18151f]/95 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-zinc-800/80 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />

                <div className="mb-6">
                    <h1 className="text-2xl font-black text-white mb-1">ตั้งรหัสผ่านใหม่</h1>
                    <p className="text-xs text-zinc-400">กรอกรหัสผ่านใหม่ที่คุณต้องการใช้งาน</p>
                </div>

                <form onSubmit={handleUpdate} className="flex flex-col gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-300">รหัสผ่านใหม่ (อย่างน้อย 8 ตัว)</label>
                        <input
                            type="password"
                            required
                            minLength={8}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-[#110f17] rounded-xl border border-zinc-800 text-white text-sm focus:outline-none focus:border-amber-500 transition placeholder:text-zinc-600"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 mt-2 bg-gradient-to-r from-amber-500 to-amber-500 hover:from-amber-400 hover:to-amber-400 text-zinc-950 font-black rounded-xl transition shadow-lg shadow-amber-500/25 text-sm tracking-wide disabled:opacity-50"
                    >
                        {loading ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
                    </button>
                </form>

                {message && (
                    <div className={`mt-4 p-3 rounded-xl text-xs font-medium text-center border ${isSuccess ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {message}
                    </div>
                )}
            </div>
        </main>
    )
}