'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Play } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { clearWatchHistory, fetchServerHistory, readLocalHistory } from '@/lib/history'
import type { ContinueWatchingItem } from '@/lib/types'

/**
 * ส่วน "ดูต่อจากที่ค้างไว้" — client เพราะอ่าน user session + localStorage
 * (ล็อกอิน → ประวัติจากตาราง watch_history, ไม่ล็อกอิน → localStorage)
 */
export default function ContinueWatching() {
    const [continueList, setContinueList] = useState<ContinueWatchingItem[]>([])

    useEffect(() => {
        let cancelled = false

        // อ่าน localStorage ก่อน (โชว์ทันที) แล้วค่อยเช็ค user ว่ามีประวัติบน server ไหม
        Promise.resolve().then(() => {
            const local = readLocalHistory()
            if (local.length > 0 && !cancelled) setContinueList(local)
        })

        supabase.auth.getUser().then(({ data: { user } }) => {
            if (cancelled) return
            if (user) {
                fetchServerHistory(user.id).then((items) => {
                    if (!cancelled && items.length > 0) setContinueList(items)
                })
            }
        })

        return () => {
            cancelled = true
        }
    }, [])

    if (continueList.length === 0) return null

    const handleClearHistory = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        await clearWatchHistory(user)
        setContinueList([])
    }

    return (
        <section id="continue" className="space-y-4 scroll-mt-24">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <span className="sec-bar" aria-hidden="true" /> ดูต่อจากที่ค้างไว้
                </h3>
                <button
                    onClick={handleClearHistory}
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition"
                >
                    ล้างประวัติการดู
                </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {continueList.slice(0, 6).map((item) => (
                    <Link key={item.movieId} href={`/title/${encodeURIComponent(item.movieTitle)}`} className="group flex flex-col active:scale-95 transition-transform">
                        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#18181b] border border-white/[0.07] group-hover:border-amber-500/40 group-hover:-translate-y-1 transition duration-300 shadow-lg">
                            {item.posterUrl ? (
                                <Image src={item.posterUrl} alt={item.movieTitle} fill sizes="(max-width: 640px) 45vw, 15vw" className="object-cover group-hover:scale-105 transition duration-500" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-700 text-xs">ไม่มีรูป</div>
                            )}

                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition flex items-center justify-center">
                                <div className="w-10 h-10 rounded-full bg-amber-400 text-[#1c1917] flex items-center justify-center pl-0.5 shadow-[0_0_20px_rgba(245,158,11,0.45)] group-hover:scale-110 transition">
                                    <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                                </div>
                            </div>

                            {item.totalEp ? (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60">
                                    <div
                                        className="h-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                                        style={{ width: `${Math.min(100, Math.max(4, Math.round(((item.lastEp || 0) / item.totalEp) * 100)))}%` }}
                                    />
                                </div>
                            ) : null}
                        </div>

                        <div className="mt-2.5 px-0.5 space-y-0.5">
                            <h4 className="text-xs font-bold text-zinc-200 group-hover:text-amber-400 transition truncate">
                                {item.movieTitle}
                            </h4>
                            <p className="text-[11px] font-semibold text-zinc-400">
                                ต่อ EP.{item.lastEp} / {item.totalEp || '??'}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    )
}
