'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { fetchRecommendations } from '@/lib/data'
import { readLocalHistory } from '@/lib/history'
import type { Movie } from '@/lib/types'

/**
 * ส่วน "แนะนำสำหรับคุณ" — client เพราะอิงจากประวัติการดูของผู้ใช้
 * (แนะนำเรื่องที่แนวเดียวกับเรื่องล่าสุดที่ดู; epCounts ส่งจาก server มาให้)
 */
export default function Recommendations({ epCounts }: { epCounts: Record<string, number> }) {
    const [recommendations, setRecommendations] = useState<Movie[]>([])

    useEffect(() => {
        let cancelled = false

        supabase.auth.getUser().then(({ data: { user } }) => {
            if (cancelled) return
            const history = readLocalHistory()
            const anchorId = user && history.length > 0 ? history[0].movieId : null

            Promise.resolve(anchorId ? fetchRecommendations(anchorId) : []).then((recs) => {
                if (!cancelled) setRecommendations(recs)
            })
        })

        return () => {
            cancelled = true
        }
    }, [])

    if (recommendations.length === 0) return null

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <span className="sec-bar" aria-hidden="true" /> แนะนำสำหรับคุณ
                </h3>
                <Link href="/movies" className="text-xs text-zinc-400 hover:text-amber-400 transition">
                    ดูทั้งหมด →
                </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {recommendations.map((movie) => (
                    <Link key={movie.id} href={`/title/${encodeURIComponent(movie.title)}`} className="group flex flex-col active:scale-95 transition-transform">
                        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#18181b] border border-white/[0.07] group-hover:border-amber-500/40 group-hover:-translate-y-1 transition duration-300 shadow-lg">
                            {movie.poster_url ? (
                                <Image src={movie.poster_url} alt={movie.title} fill sizes="(max-width: 640px) 45vw, 15vw" className="object-cover group-hover:scale-105 transition duration-500" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-700 text-xs">ไม่มีรูป</div>
                            )}
                            <span className="absolute top-2 right-2 bg-black/70 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                                {epCounts[movie.id] || 0} ตอน
                            </span>
                        </div>

                        <div className="mt-2.5 px-0.5 space-y-0.5">
                            <h4 className="text-xs font-bold text-zinc-200 group-hover:text-amber-400 transition truncate">
                                {movie.title}
                            </h4>
                            <p className="text-[11px] font-semibold text-zinc-400 truncate">
                                {movie.genre || 'ซีรีส์สั้น AI'}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    )
}
