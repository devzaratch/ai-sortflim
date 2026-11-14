'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { fetchAllMovies, fetchEpisodeCounts } from '@/lib/data'
import type { Movie } from '@/lib/types'

// รายการหมวดหมู่ทั้งหมดตามภาพตัวอย่าง
const GENRES = [
    'ทุกแนว', 'ดราม่า', 'โรแมนติก', 'ครอบครัว', 'แก้แค้น',
    'ย้อนยุค', 'แฟนตาซี', 'วาย', 'คุณธรรม', 'ผี',
    'คอมเมดี้', 'ท่านประธาน', 'รักวัยเรียน', 'แอ็คชั่น', 'พลิกชีวิต',
    'ตามหายาก', 'ประวัติศาสตร์', 'รักขมขื่น', 'เกิดใหม่', 'เทพเซียน',
    'ข้ามกาลเวลา', 'ทะลุมิติ'
]

function MoviesContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const urlGenre = searchParams.get('genre')
    const urlStatus = searchParams.get('status')
    const urlSearch = (searchParams.get('search') || '').trim()
    const savedOnly = searchParams.get('saved') === '1'

    const [movies, setMovies] = useState<Movie[]>([])
    const [epCounts, setEpCounts] = useState<{ [key: string]: number }>({})
    const [genreCounts, setGenreCounts] = useState<{ [key: string]: number }>({})
    const [loading, setLoading] = useState<boolean>(true)
    /** รายชื่อเรื่องที่ผู้ใช้เก็บไว้ (เก็บใน localStorage) — ใช้เมื่อเปิด ?saved=1 */
    const [savedMovieIds, setSavedMovieIds] = useState<string[]>([])

    // States สำหรับระบบ Filter (ตั้งค่าเริ่มต้นจาก URL เลย)
    const [selectedGenre, setSelectedGenre] = useState<string>(urlGenre ?? 'ทุกแนว')
    const [completedOnly, setCompletedOnly] = useState<boolean>(urlStatus === 'completed')
    const [sortBy, setSortBy] = useState<string>('latest') // 'latest' หรือ 'popular'
    // จำ URL รอบก่อนเพื่อ "ปรับ state ตอน render" ตาม pattern ที่ React แนะนำ
    // (แทนการซิงค์ด้วย useEffect ซึ่งทำให้ render ซ้ำ)
    const [prevUrlParams, setPrevUrlParams] = useState<{ genre: string | null; status: string | null }>({
        genre: urlGenre,
        status: urlStatus,
    })

    // เมื่อ URL เปลี่ยน (เช่น กดจากหน้าแรก) ให้ซิงค์ค่า genre/status ลงใน State
    if (prevUrlParams.genre !== urlGenre || prevUrlParams.status !== urlStatus) {
        setPrevUrlParams({ genre: urlGenre, status: urlStatus })
        setSelectedGenre(urlGenre ?? 'ทุกแนว')
        setCompletedOnly(urlStatus === 'completed')
    }

    useEffect(() => {
        // อ่านรายชื่อเรื่องที่ผู้ใช้เก็บไว้จาก localStorage (ฝั่ง client เท่านั้น)
        try {
            const raw = localStorage.getItem('bookmarked_movies')
            const parsed: unknown = raw ? JSON.parse(raw) : []
            // eslint-disable-next-line react-hooks/set-state-in-effect -- sync กับ external system (localStorage)
            setSavedMovieIds(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [])
        } catch {
            setSavedMovieIds([])
        }
    }, [savedOnly])

    useEffect(() => {
        // eslint-disable-next-line react-hooks/immutability -- data fetch on mount; helper declared below
        fetchMoviesAndEpisodes()
    }, [])

    const fetchMoviesAndEpisodes = async () => {
        setLoading(true)
        try {
            const moviesData = await fetchAllMovies()
            setMovies(moviesData)

            // คำนวณจำนวนเรื่องในแต่ละหมวดหมู่
            const gCounts: { [key: string]: number } = {}
            moviesData.forEach((m) => {
                const genres = m.genre ? m.genre.split(',').map((t) => t.trim()) : ['อื่นๆ']
                genres.forEach((g) => {
                    gCounts[g] = (gCounts[g] || 0) + 1
                })
            })
            setGenreCounts(gCounts)

            // ดึงจำนวนตอนจริงของแต่ละเรื่อง (แบ่งหน้าจนครบ ไม่โดนเพดาน 1,000 แถว)
            setEpCounts(await fetchEpisodeCounts())
        } catch (err) {
            console.error('Error fetching movies:', err)
        } finally {
            setLoading(false)
        }
    }

    // ฟังก์ชันเปลี่ยนหมวดหมู่พร้อมอัปเดต URL เพื่อให้แชร์ลิงก์ได้
    const handleGenreChange = (genre: string) => {
        setSelectedGenre(genre)
        if (genre === 'ทุกแนว') {
            router.push('/movies')
        } else {
            router.push(`/movies?genre=${encodeURIComponent(genre)}`)
        }
    }

    // กรองตามหมวดหมู่/สถานะ/คำค้นหา/เรื่องที่เก็บไว้ แล้วเรียงตามตัวเลือกจริง (ไม่ใช่แค่ UI)
    const filteredMovies = useMemo(() => {
        const searchTerm = urlSearch.toLowerCase()
        const savedSet = new Set(savedMovieIds)

        const result = movies.filter((movie) => {
            const movieGenres = movie.genre ? movie.genre.split(',').map((t) => t.trim()) : []
            const matchGenre = savedOnly || selectedGenre === 'ทุกแนว' || movieGenres.includes(selectedGenre)
            const matchCompleted = savedOnly || completedOnly ? movie.is_completed === true : true
            const matchSearch =
                !searchTerm ||
                (movie.title || '').toLowerCase().includes(searchTerm) ||
                (movie.genre || '').toLowerCase().includes(searchTerm)
            const matchSaved = !savedOnly || savedSet.has(movie.id)
            return matchGenre && matchCompleted && matchSearch && matchSaved
        })

        return [...result].sort((a, b) => {
            if (sortBy === 'popular') {
                // ยังไม่มีข้อมูลยอดวิว จึงใช้จำนวนตอนเป็นตัวแทนความนิยม
                return (epCounts[b.id] || 0) - (epCounts[a.id] || 0)
            }
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
    }, [movies, selectedGenre, completedOnly, sortBy, epCounts, urlSearch, savedOnly, savedMovieIds])

    // คำนวณหายอดรวมตอนเฉพาะเรื่องที่แสดงอยู่
    const displayedTotalEps = filteredMovies.reduce((acc, m) => acc + (epCounts[m.id] || 0), 0)

    return (
        <div className="min-h-screen bg-[#0b0b0d] text-white font-sans selection:bg-amber-500 selection:text-black flex flex-col justify-between">

            <div>
                <Header
                    activeGenre={selectedGenre === 'ทุกแนว' ? null : selectedGenre}
                    activeStatus={urlStatus}
                />

                <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">

                    {/* แถบแจ้งโหมดค้นหา / เรื่องที่เก็บไว้ */}
                    {(urlSearch || savedOnly) && (
                        <div className="flex flex-wrap items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-4 py-2.5 rounded-xl text-xs font-bold">
                            {savedOnly ? (
                                <span>❤️ แสดงเฉพาะเรื่องที่คุณเก็บไว้</span>
                            ) : (
                                <span>🔍 ผลการค้นหา &ldquo;{urlSearch}&rdquo;</span>
                            )}
                            <button
                                onClick={() => router.push('/movies')}
                                className="ml-auto text-zinc-400 hover:text-white transition font-bold"
                            >
                                ✕ ล้างตัวกรอง
                            </button>
                        </div>
                    )}

                    {/* Title & Info Banner */}
                    <div className="space-y-1">
                        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                            {savedOnly
                                ? 'เรื่องที่เก็บไว้'
                                : urlSearch
                                    ? `ผลการค้นหา: ${urlSearch}`
                                    : selectedGenre === 'ทุกแนว'
                                        ? 'ละคร AI ทั้งหมด'
                                        : `ละคร AI แนว${selectedGenre}`}
                        </h1>
                        <p className="text-xs text-zinc-400">
                            {filteredMovies.length} เรื่อง • {displayedTotalEps} ตอน • คัดสรรความสนุก พากย์ไทย จัดเรียงตอนตั้งแต่ EP.1
                        </p>
                    </div>

                    {/* Filter Bar (แท็บหมวดหมู่ครบทุกแท็กตามภาพตัวอย่าง) */}
                    <div className="space-y-4 bg-zinc-900/40 border border-zinc-800/80 p-4 rounded-2xl">

                        {/* แถบหมวดหมู่ */}
                        <div className="flex flex-wrap items-center gap-2 max-h-48 overflow-y-auto pr-1">
                            {GENRES.map((genre) => {
                                const count = genre === 'ทุกแนว' ? movies.length : (genreCounts[genre] || 0)
                                return (
                                    <button
                                        key={genre}
                                        onClick={() => handleGenreChange(genre)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${selectedGenre === genre
                                            ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                                            : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                                            }`}
                                    >
                                        <span>{genre}</span>
                                        {genre !== 'ทุกแนว' && count > 0 && (
                                            <span className="text-[10px] opacity-70 bg-black/20 px-1.5 py-0.2 rounded-full">
                                                {count}
                                            </span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>

                        {/* แถบย่อย: ปุ่มติ๊ก "จบแล้วเท่านั้น" และตัวเลือกเรียงลำดับ */}
                        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-zinc-800/60 text-xs">
                            <label className="flex items-center gap-2 cursor-pointer font-bold text-zinc-300 select-none">
                                <input
                                    type="checkbox"
                                    checked={completedOnly}
                                    onChange={(e) => setCompletedOnly(e.target.checked)}
                                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                                />
                                <span>📌 จบแล้วเท่านั้น</span>
                            </label>

                            <div className="flex items-center gap-3 text-zinc-400">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="bg-zinc-800 border border-zinc-700 text-zinc-200 px-3 py-1.5 rounded-xl text-xs font-bold focus:outline-none focus:border-amber-500"
                                >
                                    <option value="latest">ใหม่ล่าสุด</option>
                                    <option value="popular">ยอดนิยม</option>
                                </select>
                                <span>แสดง {filteredMovies.length} เรื่อง</span>
                            </div>
                        </div>
                    </div>

                    {/* Movies Grid (แสดงรายการหนังตามที่กรอง) */}
                    <section>
                        {loading ? (
                            <div className="text-center py-20 text-zinc-500 text-xs animate-pulse">กำลังโหลดคลังละคร...</div>
                        ) : filteredMovies.length === 0 ? (
                            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-500 text-xs space-y-3">
                                <p>ไม่พบละครในหมวดหมู่ที่คุณเลือก</p>
                                <button onClick={() => handleGenreChange('ทุกแนว')} className="text-amber-400 hover:underline font-bold">
                                    ดูละครทั้งหมด
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 sm:gap-5">
                                {filteredMovies.map((movie) => (
                                    <Link key={movie.id} href={`/title/${encodeURIComponent(movie.title)}`} className="group flex flex-col active:scale-95 transition-transform">
                                        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800/90 group-hover:border-amber-500/70 transition duration-300 shadow-xl">

                                            {/* Badge: จบแล้ว */}
                                            {movie.is_completed && (
                                                <div className="absolute top-2 right-2 z-10 bg-emerald-500/90 text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                                                    จบแล้ว
                                                </div>
                                            )}

                                            {movie.poster_url ? (
                                                <Image
                                                    src={movie.poster_url}
                                                    alt={movie.title}
                                                    fill
                                                    sizes="(max-width: 640px) 45vw, 15vw"
                                                    className="object-cover group-hover:scale-105 transition duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-zinc-700 text-xs">ไม่มีรูปโปสเตอร์</div>
                                            )}

                                            {/* Badge: จำนวนตอนจริง */}
                                            <div className="absolute bottom-2 left-2 z-10 bg-black/70 backdrop-blur-sm text-zinc-200 text-[10px] font-bold px-2 py-0.5 rounded border border-zinc-700/50">
                                                {epCounts[movie.id] || 0} ตอน
                                            </div>
                                        </div>

                                        <div className="mt-2.5 px-0.5 space-y-0.5">
                                            <h4 className="text-xs sm:text-sm font-bold text-zinc-200 group-hover:text-amber-400 transition truncate">
                                                {movie.title}
                                            </h4>
                                            <p className="text-[10px] text-zinc-500 truncate">
                                                {movie.genre || 'ซีรีส์สั้น'}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>

                </main>
            </div>

            {/* Footer Component ด้านล่างสุด */}
            <Footer />
        </div>
    )
}

export default function AllMoviesPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0b0b0d] text-white flex items-center justify-center text-xs">กำลังโหลดหน้า...</div>}>
            <MoviesContent />
        </Suspense>
    )
}