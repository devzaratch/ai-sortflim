'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Flame, Play } from 'lucide-react'
import type { Movie } from '@/lib/types'

/**
 * Hero carousel หน้าแรก — client เพราะสไลด์อัตโนมัติทุก 5 วิ
 * (ข้อมูลส่งจาก Server Component มาให้เป็น props แล้ว ไม่ fetch เอง)
 */
export default function HeroCarousel({
    heroMovies,
    epCounts,
}: {
    heroMovies: Movie[]
    epCounts: Record<string, number>
}) {
    const [activeIndex, setActiveIndex] = useState(0)

    useEffect(() => {
        if (heroMovies.length <= 1) return
        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % heroMovies.length)
        }, 5000)
        return () => clearInterval(interval)
    }, [heroMovies.length])

    if (heroMovies.length === 0) return null

    const activeMovie = heroMovies[activeIndex]
    const prevIndex = (activeIndex - 1 + heroMovies.length) % heroMovies.length
    const nextIndex = (activeIndex + 1) % heroMovies.length

    return (
        <section className="relative w-full rounded-3xl bg-gradient-to-b from-[#17110a] to-[#0a0a0b] p-6 sm:p-10 md:p-12 overflow-hidden border border-white/[0.07] shadow-2xl">
            {/* ambient amber glow */}
            <div aria-hidden="true" className="absolute -top-44 left-1/2 -translate-x-1/2 w-[560px] h-[360px] rounded-full bg-amber-500/20 blur-[90px] pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[360px] relative">

                <div className="lg:col-span-7 space-y-4 z-10 flex flex-col justify-center">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-amber-500/15 text-amber-400 border border-amber-500/35 text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                            <Flame className="w-3.5 h-3.5" aria-hidden="true" /> กำลังมาแรง • เรื่องเด่นแนะนำ
                        </span>
                        {activeMovie.is_completed && (
                            <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold px-3 py-1 rounded-full">
                                จบแล้ว
                            </span>
                        )}
                    </div>

                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-md">
                        {activeMovie.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                        <span className="bg-white/[0.06] text-zinc-300 px-2.5 py-0.5 rounded-full border border-white/[0.07]">
                            {epCounts[activeMovie.id] || 0} ตอน
                        </span>
                        <span className="bg-white/[0.06] text-zinc-300 px-2.5 py-0.5 rounded-full border border-white/[0.07]">
                            {activeMovie.genre || 'ซีรีส์สั้น AI'}
                        </span>
                        <span className="bg-white/[0.06] text-zinc-400 px-2.5 py-0.5 rounded-full border border-white/[0.07]">
                            แนวตั้ง 9:16
                        </span>
                    </div>

                    <p className="text-xs sm:text-sm text-zinc-400 line-clamp-3 leading-relaxed max-w-xl">
                        {activeMovie.description || 'เตรียมพบกับเรื่องราวสุดเข้มข้น ลุ้นระทึกทุกตอน ดูฟรี EP.1 คมชัดระดับ HD บนระบบสตรีมมิ่ง AI แนวตั้งได้แล้ววันนี้!'}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                        <Link
                            href={`/title/${encodeURIComponent(activeMovie.title)}`}
                            className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#1c1917] font-extrabold px-7 py-3 rounded-full transition flex items-center gap-2 shadow-[0_6px_28px_rgba(245,158,11,0.35)] hover:shadow-[0_10px_36px_rgba(245,158,11,0.5)] hover:-translate-y-0.5 text-xs sm:text-sm active:scale-95 min-h-11"
                        >
                            <Play className="w-4 h-4 fill-current" aria-hidden="true" /> ดู EP.1 ฟรี
                        </Link>

                        <Link
                            href={`/title/${encodeURIComponent(activeMovie.title)}`}
                            className="bg-white/[0.06] hover:bg-[#18181b] text-zinc-200 font-bold px-6 py-3 rounded-full transition text-xs sm:text-sm border border-white/[0.07] hover:border-amber-500/35 min-h-11 active:scale-95"
                        >
                            รายชื่อตอน
                        </Link>
                    </div>

                    <div className="flex items-center gap-2 pt-4">
                        {heroMovies.map((movie, idx) => (
                            <button
                                key={movie.id}
                                aria-label={`เลื่อนไปเรื่องที่ ${idx + 1}`}
                                onClick={() => setActiveIndex(idx)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${activeIndex === idx ? 'w-8 bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'w-2 bg-zinc-700 hover:bg-zinc-500'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-5 flex items-center justify-center lg:justify-end relative min-h-[300px]">
                    <div className="relative flex items-center justify-center w-full max-w-[400px]">

                        {heroMovies.length > 2 && (
                            <div
                                onClick={() => setActiveIndex(prevIndex)}
                                className="absolute -left-2 sm:left-0 z-0 w-28 sm:w-36 aspect-[3/4] rounded-xl overflow-hidden shadow-xl opacity-40 scale-90 border border-white/[0.08] cursor-pointer hover:opacity-70 transition duration-300"
                            >
                                <Image
                                    src={heroMovies[prevIndex]?.poster_url || '/placeholder.jpg'}
                                    alt="prev"
                                    fill
                                    sizes="150px"
                                    priority={true}
                                    className="object-cover"
                                />
                            </div>
                        )}

                        <div className="z-20 w-44 sm:w-52 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-amber-400/80 relative transform scale-105 transition-all duration-500 shadow-[0_24px_60px_rgba(0,0,0,0.6),0_0_60px_rgba(245,158,11,0.14)]">
                            {activeMovie.poster_url ? (
                                <Image
                                    src={activeMovie.poster_url}
                                    alt={activeMovie.title}
                                    fill
                                    sizes="300px"
                                    priority={true}
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-600 text-xs">ไม่มีรูปโปสเตอร์</div>
                            )}
                        </div>

                        {heroMovies.length > 1 && (
                            <div
                                onClick={() => setActiveIndex(nextIndex)}
                                className="absolute -right-2 sm:right-0 z-0 w-28 sm:w-36 aspect-[3/4] rounded-xl overflow-hidden shadow-xl opacity-40 scale-90 border border-white/[0.08] cursor-pointer hover:opacity-70 transition duration-300"
                            >
                                <Image
                                    src={heroMovies[nextIndex]?.poster_url || '/placeholder.jpg'}
                                    alt="next"
                                    fill
                                    sizes="150px"
                                    priority={true}
                                    className="object-cover"
                                />
                            </div>
                        )}

                    </div>
                </div>

            </div>
        </section>
    )
}
