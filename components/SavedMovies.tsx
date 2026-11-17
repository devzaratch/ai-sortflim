'use client'

import { useEffect, useMemo, useState } from 'react'
import { Heart } from 'lucide-react'
import MovieGrid from '@/components/MovieGrid'
import { fetchEpisodeCounts, fetchMoviesList } from '@/lib/data'
import type { Movie } from '@/lib/types'

/**
 * โหมด "เรื่องที่เก็บไว้" — อ่านรายชื่อจาก localStorage ซึ่งทำได้ฝั่ง client เท่านั้น
 * (ใช้ร่วมกับหน้า /movies?saved=1 ที่เป็น Server Component)
 */
export default function SavedMovies() {
    const [movies, setMovies] = useState<Movie[]>([])
    const [epCounts, setEpCounts] = useState<Record<string, number>>({})
    const [savedIds, setSavedIds] = useState<string[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                const raw = localStorage.getItem('bookmarked_movies')
                const parsed: unknown = raw ? JSON.parse(raw) : []
                const ids = Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
                setSavedIds(ids)
            } catch {
                setSavedIds([])
            }

            const [list, counts] = await Promise.all([fetchMoviesList(), fetchEpisodeCounts()])
            setMovies(list)
            setEpCounts(counts)
            setLoading(false)
        }
        load()
    }, [])

    const savedSet = useMemo(() => new Set(savedIds), [savedIds])
    const savedMovies = movies.filter((m) => savedSet.has(m.id))

    return (
        <>
            <div className="flex flex-wrap items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-4 py-2.5 rounded-xl text-xs font-bold">
                <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5" aria-hidden="true" /> แสดงเฉพาะเรื่องที่คุณเก็บไว้</span>
                <a href="/movies" className="ml-auto text-zinc-400 hover:text-white transition font-bold flex items-center gap-1">
                    ล้างตัวกรอง
                </a>
            </div>

            <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">เรื่องที่เก็บไว้</h1>
                <p className="text-xs text-zinc-400">{savedMovies.length} เรื่อง</p>
            </div>

            <section>
                {loading ? (
                    <div className="text-center py-20 text-zinc-500 text-xs animate-pulse">กำลังโหลดรายการที่เก็บไว้...</div>
                ) : savedMovies.length === 0 ? (
                    <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-500 text-xs space-y-3">
                        <p>ยังไม่มีเรื่องที่เก็บไว้ — กดปุ่มหัวใจบนหน้าเรื่องเพื่อเก็บไว้ดูภายหลัง</p>
                        <a href="/movies" className="inline-block text-amber-400 hover:underline font-bold">
                            ดูละครทั้งหมด
                        </a>
                    </div>
                ) : (
                    <MovieGrid movies={savedMovies} epCounts={epCounts} priorityCount={2} />
                )}
            </section>
        </>
    )
}
