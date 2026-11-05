'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import Link from 'next/link'
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

    const [movies, setMovies] = useState<Movie[]>([])
    const [epCounts, setEpCounts] = useState<{ [key: string]: number }>({})
    const [genreCounts, setGenreCounts] = useState<{ [key: string]: number }>({})
    const [loading, setLoading] = useState<boolean>(true)

    // States สำหรับระบบ Filter
    const [selectedGenre, setSelectedGenre] = useState<string>('ทุกแนว')
    const [completedOnly, setCompletedOnly] = useState<boolean>(false)
    const [sortBy, setSortBy] = useState<string>('latest') // 'latest' หรือ 'popular'

    // เมื่อ URL เปลี่ยน (เช่น กดจากหน้าแรก) ให้ซิงค์ค่า genre ลงใน State
    useEffect(() => {
        if (urlGenre) {
            setSelectedGenre(urlGenre)
        } else {
            setSelectedGenre('ทุกแนว')
        }

        if (urlStatus === 'completed') {
            setCompletedOnly(true)
        } else {
            setCompletedOnly(false)
        }
    }, [urlGenre, urlStatus])

    useEffect(() => {
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

    // กรองตามหมวดหมู่/สถานะ แล้วเรียงตามตัวเลือกจริง (ไม่ใช่แค่ UI)
    const filteredMovies = useMemo(() => {
        const result = movies.filter((movie) => {
            const movieGenres = movie.genre ? movie.genre.split(',').map((t) => t.trim()) : []
            const matchGenre = selectedGenre === 'ทุกแนว' || movieGenres.includes(selectedGenre)
            const matchCompleted = completedOnly ? movie.is_completed === true : true
            return matchGenre && matchCompleted
        })

        return [...result].sort((a, b) => {
            if (sortBy === 'popular') {
                // ยังไม่มีข้อมูลยอดวิว จึงใช้จำนวนตอนเป็นตัวแทนความนิยม
                return (epCounts[b.id] || 0) - (epCounts[a.id] || 0)
            }
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
    }, [movies, selectedGenre, completedOnly, sortBy, epCounts])

    // คำนวณหายอดรวมตอนเฉพาะเรื่องที่แสดงอยู่
    const displayedTotalEps = filteredMovies.reduce((acc, m) => acc + (epCounts[m.id] || 0), 0)

    return (
        <div className="min-h-screen bg-[#0b0b0d] text-white font-sans selection:bg-orange-500 selection:text-black flex flex-col justify-between">

            <div>
                <Header
                    activeGenre={selectedGenre === 'ทุกแนว' ? null : selectedGenre}
                    activeStatus={urlStatus}
                />

                <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">

                    {/* Title & Info Banner */}
                    <div className="space-y-1">
                        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                            {selectedGenre === 'ทุกแนว' ? 'ละคร AI ทั้งหมด' : `ละคร AI แนว${selectedGenre}`}
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
                                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
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
                                    className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
                                />
                                <span>📌 จบแล้วเท่านั้น</span>
                            </label>

                            <div className="flex items-center gap-3 text-zinc-400">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="bg-zinc-800 border border-zinc-700 text-zinc-200 px-3 py-1.5 rounded-xl text-xs font-bold focus:outline-none focus:border-orange-500"
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
                                <button onClick={() => handleGenreChange('ทุกแนว')} className="text-orange-400 hover:underline font-bold">
                                    ดูละครทั้งหมด
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 sm:gap-5">
                                {filteredMovies.map((movie) => (
                                    <Link key={movie.id} href={`/movie-detail?movieId=${movie.id}`} className="group flex flex-col">
                                        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800/90 group-hover:border-orange-500/70 transition duration-300 shadow-xl">

                                            {/* Badge: จบแล้ว */}
                                            {movie.is_completed && (
                                                <div className="absolute top-2 right-2 z-10 bg-emerald-500/90 text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                                                    จบแล้ว
                                                </div>
                                            )}

                                            {movie.poster_url ? (
                                                <img
                                                    src={movie.poster_url}
                                                    alt={movie.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
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
                                            <h4 className="text-xs sm:text-sm font-bold text-zinc-200 group-hover:text-orange-400 transition truncate">
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