'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import LogoIcon from '@/components/LogoIcon'

export default function Footer() {
    const [currentYear, setCurrentYear] = useState<number>(2026)

    useEffect(() => {
        setCurrentYear(new Date().getFullYear())
    }, [])

    return (
        <footer className="w-full bg-[#070709] border-t border-zinc-800/80 text-zinc-400 font-sans mt-20">
            <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">

                    {/* Column 1: Brand Info */}
                    <div className="lg:col-span-2 space-y-4">
                        <Link href="/" className="text-2xl font-black tracking-tighter text-white inline-flex items-center gap-2">
                            <LogoIcon className="w-8 h-8 shrink-0" />
                            <span className="bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">MOVIES</span>
                            <span className="bg-amber-500 text-zinc-950 px-2 py-0.5 rounded-lg text-xs font-black tracking-normal shadow-lg shadow-amber-500/20">AI</span>
                        </Link>

                        <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
                            ศูนย์รวมละคร AI ซีรีส์ AI แนวตั้งพากย์ไทยยอดฮิต ดูฟรีครบทุกตอน สนุก เข้มข้น คมชัดระดับ HD อัปเดตตอนใหม่ทุกวัน ตอบโจทย์คนรักความบันเทิงยุคใหม่
                        </p>

                        <div className="flex items-center gap-3 pt-2">
                            <span className="text-[11px] text-zinc-500 font-semibold">ติดตามเราได้ที่:</span>
                            <div className="flex gap-2">
                                {/* Facebook Icon (SVG) */}
                                <a
                                    href="https://facebook.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-amber-400 hover:border-amber-500/50 transition"
                                    title="Facebook"
                                >
                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                    </svg>
                                </a>

                                {/* TikTok Icon (SVG) */}
                                <a
                                    href="https://tiktok.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-amber-400 hover:border-amber-500/50 transition"
                                    title="TikTok"
                                >
                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                                    </svg>
                                </a>

                                {/* YouTube Icon (SVG) */}
                                <a
                                    href="https://youtube.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-amber-400 hover:border-amber-500/50 transition"
                                    title="YouTube"
                                >
                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Column 2: หมวดหมู่ยอดนิยม */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">หมวดหมู่ยอดฮิต</h4>
                        <ul className="space-y-2 text-xs">
                            <li>
                                <Link href="/movies?genre=ดราม่า" className="hover:text-amber-400 transition">ละคร AI แนวดราม่า</Link>
                            </li>
                            <li>
                                <Link href="/movies?genre=โรแมนติก" className="hover:text-amber-400 transition">ละคร AI โรแมนติก</Link>
                            </li>
                            <li>
                                <Link href="/movies?genre=ย้อนยุค" className="hover:text-amber-400 transition">ละคร AI ย้อนยุค</Link>
                            </li>
                            <li>
                                <Link href="/movies?genre=แก้แค้น" className="hover:text-amber-400 transition">ซีรีส์ AI แนวแก้แค้น</Link>
                            </li>
                            <li>
                                <Link href="/movies?genre=วาย" className="hover:text-amber-400 transition">ซีรีส์ AI แนว Y</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 3: เมนูลัด / บริการ */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">เมนูแนะนำ</h4>
                        <ul className="space-y-2 text-xs">
                            <li>
                                <Link href="/" className="hover:text-amber-400 transition">หน้าแรก</Link>
                            </li>
                            <li>
                                <Link href="/movies" className="hover:text-amber-400 transition">ซีรีส์ทั้งหมด</Link>
                            </li>
                            <li>
                                <Link href="/movies?status=completed" className="hover:text-amber-400 transition">ซีรีส์จบแล้ว</Link>
                            </li>
                            <li>
                                <Link href="/login" className="hover:text-amber-400 transition">เข้าสู่ระบบ / สมัครสมาชิก</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 4: นโยบาย & ช่วยเหลือ */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">ช่วยเหลือ & นโยบาย</h4>
                        <ul className="space-y-2 text-xs">
                            <li>
                                <Link href="/privacy-policy" className="hover:text-amber-400 transition">นโยบายความเป็นส่วนตัว</Link>
                            </li>
                            <li>
                                <Link href="/terms-of-service" className="hover:text-amber-400 transition">ข้อตกลงและเงื่อนไข</Link>
                            </li>
                            <li>
                                <Link href="/dmca" className="hover:text-amber-400 transition">แจ้งละเมิดลิขสิทธิ์ (DMCA)</Link>
                            </li>
                            <li>
                                <a href="mailto:support@moviesai.com" className="hover:text-amber-400 transition">ติดต่อเรา / แจ้งปัญหา</a>
                            </li>
                        </ul>
                    </div>

                </div>

                {/* Bottom Divider & Copyright */}
                <div className="mt-12 pt-6 border-t border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500">
                    <p>© {currentYear} MOVIES AI. All rights reserved.</p>
                    <p className="text-center sm:text-right">
                        แพลตฟอร์มสตรีมมิ่งซีรีส์สั้นแนวตั้งด้วยเทคโนโลยี AI
                    </p>
                </div>
            </div>
        </footer>
    )
}