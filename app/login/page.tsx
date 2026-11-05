'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Check, X } from 'lucide-react'

export default function AuthPage() {
    const [isSignUp, setIsSignUp] = useState(false)
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [isSuccess, setIsSuccess] = useState(false)
    const router = useRouter()

    const isUsernameFormatValid = /^[a-zA-Z0-9]+$/.test(username)
    const isUsernameValid = username.length >= 4 && isUsernameFormatValid
    const isPasswordValid = password.length >= 8
    const isPasswordMatch = password === confirmPassword && confirmPassword.length > 0

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage('')
        setIsSuccess(false)

        if (isSignUp) {
            if (!isUsernameValid) {
                setMessage('ชื่อผู้ใช้ต้องใช้อักษร a-z, A-Z และตัวเลข 0-9 เท่านั้น (อย่างน้อย 4 ตัว)')
                setLoading(false)
                return
            }
            if (!isPasswordValid) {
                setMessage('รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร')
                setLoading(false)
                return
            }
            if (!isPasswordMatch) {
                setMessage('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน')
                setLoading(false)
                return
            }

            // 1. สมัครสมาชิกผ่าน Supabase Auth
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username: username.trim()
                    }
                }
            })

            if (error) {
                setMessage(error.message)
                setLoading(false)
                return
            }

            // 2. บันทึกข้อมูลลงตาราง profiles โดยตรงจากหน้าบ้านทันที
            if (data.user) {
                const { error: profileError } = await supabase.from('profiles').upsert({
                    id: data.user.id,
                    email: email,
                    username: username.trim(),
                    role: 'user'
                }, { onConflict: 'id' })

                if (profileError) {
                    console.error('Profile save error:', profileError)
                }
            }

            setIsSuccess(true)
            setMessage('สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลเพื่อยืนยันตัวตน')
        } else {
            const { error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) {
                setMessage(error.message)
            } else {
                setIsSuccess(true)
                setMessage('เข้าสู่ระบบสำเร็จ กำลังนำคุณเข้าสู่หน้าหลัก...')
                setTimeout(() => {
                    router.push('/')
                }, 1000)
            }
        }
        setLoading(false)
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-[#141218] via-[#0e0c10] to-[#1a1410] text-white flex flex-col items-center justify-center p-4 font-sans selection:bg-orange-500 selection:text-black">

            <div className="mb-6 text-center">
                <Link href="/" className="text-3xl font-black tracking-tighter inline-flex items-center gap-1.5">
                    <span className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">MOVIES</span>
                    <span className="bg-orange-500 text-zinc-950 px-2 py-0.5 rounded-lg text-xs font-black tracking-normal shadow-lg shadow-orange-500/20">AI</span>
                </Link>
            </div>

            <div className="w-full max-w-lg bg-[#18151f]/95 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-zinc-800/80 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent" />

                <div className="mb-6">
                    <h1 className="text-2xl font-black text-white mb-1">
                        {isSignUp ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
                    </h1>
                    <p className="text-xs text-zinc-400">
                        {isSignUp ? 'สร้างบัญชีผู้ใช้ฟรี ใช้เวลาไม่ถึงนาที' : 'ยินดีต้อนรับกลับมา กรอกข้อมูลด้านล่างเพื่อเข้าใช้งาน'}
                    </p>
                </div>

                <form onSubmit={handleAuth} className="flex flex-col gap-4">
                    {isSignUp && (
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-300">ชื่อผู้ใช้ (Username)</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className={`w-full px-4 py-3 bg-[#110f17] rounded-xl border text-white text-sm focus:outline-none transition placeholder:text-zinc-600 pr-10 ${username.length > 0
                                        ? isUsernameValid
                                            ? 'border-emerald-500/80 focus:border-emerald-500'
                                            : 'border-red-500/80 focus:border-red-500'
                                        : 'border-zinc-800 focus:border-orange-500'
                                        }`}
                                    placeholder="อย่างน้อย 4 ตัว"
                                />
                                {username.length > 0 && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {isUsernameValid ? (
                                            <Check size={16} className="text-emerald-400" />
                                        ) : (
                                            <X size={16} className="text-red-400 cursor-pointer" onClick={() => setUsername('')} />
                                        )}
                                    </div>
                                )}
                            </div>
                            {username.length > 0 ? (
                                isUsernameValid ? (
                                    <p className="text-[11px] text-emerald-400 pt-0.5 font-medium">ใช้ชื่อนี้ได้</p>
                                ) : !isUsernameFormatValid ? (
                                    <p className="text-[11px] text-red-400 pt-0.5 font-medium">ใช้อักษร a-z, A-Z และตัวเลข 0-9 เท่านั้น</p>
                                ) : (
                                    <p className="text-[11px] text-red-400 pt-0.5 font-medium">ต้องมีอย่างน้อย 4 ตัวอักษร</p>
                                )
                            ) : (
                                <p className="text-[11px] text-zinc-500 pt-0.5">ใช้อักษร a-z, A-Z และตัวเลข 0-9 เท่านั้น</p>
                            )}
                        </div>
                    )}

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

                    {isSignUp ? (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-zinc-300">รหัสผ่าน</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className={`w-full pl-4 pr-16 py-3 bg-[#110f17] rounded-xl border text-white text-sm focus:outline-none transition placeholder:text-zinc-600 ${password.length > 0 && !isPasswordValid ? 'border-red-500/80' : 'border-zinc-800 focus:border-orange-500'
                                                }`}
                                            placeholder="อย่างน้อย 8 ตัว"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-zinc-500">
                                            {password.length > 0 && (
                                                <X size={14} className="cursor-pointer hover:text-zinc-300" onClick={() => setPassword('')} />
                                            )}
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="hover:text-zinc-300 transition">
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-zinc-300">ยืนยันรหัสผ่าน</label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className={`w-full pl-4 pr-16 py-3 bg-[#110f17] rounded-xl border text-white text-sm focus:outline-none transition placeholder:text-zinc-600 ${confirmPassword.length > 0 && !isPasswordMatch ? 'border-red-500/80' : 'border-zinc-800 focus:border-orange-500'
                                                }`}
                                            placeholder="พิมพ์รหัสผ่านอีกครั้ง"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-zinc-500">
                                            {confirmPassword.length > 0 && (
                                                <X size={14} className="cursor-pointer hover:text-zinc-300" onClick={() => setConfirmPassword('')} />
                                            )}
                                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="hover:text-zinc-300 transition">
                                                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <div className="flex gap-1">
                                    <div className={`h-1 flex-1 rounded-full ${password.length >= 4 ? 'bg-orange-500' : 'bg-zinc-800'}`} />
                                    <div className={`h-1 flex-1 rounded-full ${password.length >= 8 ? 'bg-orange-500' : 'bg-zinc-800'}`} />
                                    <div className={`h-1 flex-1 rounded-full ${isPasswordValid && /[0-9]/.test(password) ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
                                </div>
                                {password.length > 0 && !isPasswordValid ? (
                                    <p className="text-[11px] text-red-400">ต้องมีอย่างน้อย 8 ตัวอักษร ผสมตัวอักษร + ตัวเลข</p>
                                ) : confirmPassword.length > 0 && !isPasswordMatch ? (
                                    <p className="text-[11px] text-red-400">รหัสผ่านไม่ตรงกัน</p>
                                ) : (
                                    <p className="text-[11px] text-zinc-500">อย่างน้อย 8 ตัว ผสมตัวอักษร + ตัวเลข (เช่น abc12345)</p>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-zinc-300">รหัสผ่าน</label>
                                <Link href="/forgot-password" className="text-[11px] text-orange-400 hover:text-orange-300 transition font-medium">
                                    ลืมรหัสผ่าน?
                                </Link>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-4 pr-10 py-3 bg-[#110f17] rounded-xl border border-zinc-800 text-white text-sm focus:outline-none focus:border-orange-500 transition placeholder:text-zinc-600"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 mt-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-zinc-950 font-black rounded-xl transition shadow-lg shadow-orange-500/25 text-sm tracking-wide disabled:opacity-50 active:scale-[0.99]"
                    >
                        {loading ? 'กำลังดำเนินการ...' : isSignUp ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
                    </button>
                </form>

                {message && (
                    <div className={`mt-4 p-3 rounded-xl text-xs font-medium text-center border ${isSuccess ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {message}
                    </div>
                )}

                <div className="mt-6 pt-5 border-t border-zinc-800/80 text-center">
                    <button
                        onClick={() => {
                            setIsSignUp(!isSignUp)
                            setMessage('')
                        }}
                        className="text-xs text-zinc-400 hover:text-white transition font-medium"
                    >
                        {isSignUp ? (
                            <>มีบัญชีอยู่แล้ว? <span className="text-orange-400 font-bold">เข้าสู่ระบบ</span></>
                        ) : (
                            <>ยังไม่มีบัญชีผู้ใช้? <span className="text-orange-400 font-bold">สมัครสมาชิก</span></>
                        )}
                    </button>
                </div>
            </div>

            <div className="mt-6 text-center">
                <Link href="/" className="text-xs text-zinc-400 hover:text-zinc-200 transition">
                    ← กลับสู่หน้าแรก
                </Link>
            </div>
        </main>
    )
}