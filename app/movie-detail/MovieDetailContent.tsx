'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Comments from '@/components/Comments'

const BOOKMARK_STORAGE_KEY = 'bookmarked_movies'

interface MovieDetailContentProps {
    movieId: string | null
}

function MovieDetailContent({ movieId }: MovieDetailContentProps) {
    const [movie, setMovie] = useState<any>(null)
    const [episodes, setEpisodes] = useState<any[]>([])
    const [similarMovies, setSimilarMovies] = useState<any[]>([])
    const [loading, setLoading] = useState<boolean>(Boolean(movieId))
    const [isBookmarked, setIsBookmarked] = useState<boolean>(false)
    const [sortAsc, setSortAsc] = useState<boolean>(true) // true = EP.1 -> ล่าสุด
    const [lastWatchedEp, setLastWatchedEp] = useState<number>(1)

    useEffect(() => {
        if (movieId) {
            fetchMovieDetail(movieId)
            loadWatchHistory(movieId)
            loadBookmark(movieId)
        }
    }, [movieId])

    const loadBookmark = (mId: string) => {
        try {
            const raw = localStorage.getItem(BOOKMARK_STORAGE_KEY)
            const ids: unknown = raw ? JSON.parse(raw) : []
            setIsBookmarked(Array.isArray(ids) && ids.includes(mId))
        } catch {
            setIsBookmarked(false)
        }
    }

    const toggleBookmark = () => {
        if (!movieId) return

        setIsBookmarked((prev) => {
            const next = !prev
            try {
                const raw = localStorage.getItem(BOOKMARK_STORAGE_KEY)
                const parsed: unknown = raw ? JSON.parse(raw) : []
                const ids: string[] = Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
                const updated = next ? Array.from(new Set([...ids, movieId])) : ids.filter((id) => id !== movieId)
                localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(updated))
            } catch (e) {
                console.error('Failed to save bookmark:', e)
            }
            return next
        })
    }

    const loadWatchHistory = (mId: string) => {
        try {
            const saved = localStorage.getItem('continue_watching_history')
            if (saved) {
                const history = JSON.parse(saved)
                const match = history.find((item: any) => item.movieId === mId)
                if (match) {
                    setLastWatchedEp(match.lastEp || 1)
                }
            }
        } catch (e) {
            console.error(e)
        }
    }

    const fetchMovieDetail = async (id: string) => {
        setLoading(true)
        try {
            const { data: movieData } = await supabase
                .from('movies')
                .select('*')
                .eq('id', id)
                .maybeSingle()

            if (movieData) {
                setMovie(movieData)

                const primaryGenre = movieData.genre ? movieData.genre.split(',')[0].trim() : 'ดราม่า'
                const { data: similar } = await supabase
                    .from('movies')
                    .select('*')
                    .neq('id', id)
                    .ilike('genre', `%${primaryGenre}%`)
                    .limit(3)

                if (similar) setSimilarMovies(similar)
            }

            const { data: epData } = await supabase
                .from('episodes')
                .select('*')
                .eq('movie_id', id)
                .order('episode_number', { ascending: true })

            if (epData) {
                setEpisodes(epData)
            }
        } catch (err) {
            console.error('Error fetching detail:', err)
        } finally {
            setLoading(false)
        }
    }

    const sortedEpisodes = [...episodes].sort((a, b) => {
        return sortAsc ? a.episode_number - b.episode_number : b.episode_number - a.episode_number
    })

    const handleShare = () => {
        if (typeof window !== 'undefined') {
            navigator.clipboard.writeText(window.location.href)
            alert('คัดลอกลิงก์เรื่องนี้เรียบร้อยแล้ว!')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0b0b0d] text-white flex items-center justify-center text-xs animate-pulse">
                กำลังโหลดข้อมูลละคร...
            </div>
        )
    }

    if (!movie) {
        return (
            <div className="min-h-screen bg-[#0b0b0d] text-white flex flex-col items-center justify-center space-y-4">
                <p className="text-zinc-400 text-sm">ไม่พบข้อมูลละครเรื่องนี้</p>
                <Link href="/" className="bg-amber-500 text-black font-bold px-4 py-2 rounded-xl text-xs">
                    กลับสู่หน้าแรก
                </Link>
            </div>
        )
    }

    // แปลงข้อความ genre ให้เป็นอาเรย์แท็ก
    const genreTags = movie.genre ? movie.genre.split(',').map((t: string) => t.trim()) : []

    return (
        <div className="min-h-screen bg-[#0b0b0d] text-white font-sans selection:bg-amber-500 selection:text-black flex flex-col justify-between">

            <div>
                <Header activeGenre={genreTags[0] ?? null} />

                <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-8">

                    {/* Breadcrumb Path */}
                    <div className="text-xs text-zinc-400 flex items-center gap-2 font-medium">
                        <Link href="/" className="hover:text-white transition">หน้าแรก</Link>
                        <span>&gt;</span>
                        <Link href="/movies" className="hover:text-white transition">{genreTags[0] || 'ซีรีส์สั้น'}</Link>
                        <span>&gt;</span>
                        <span className="text-zinc-200 truncate">{movie.title}</span>
                    </div>

                    {/* HERO DETAIL CARD */}
                    <section className="relative w-full rounded-3xl overflow-hidden p-6 sm:p-8 md:p-10 border border-zinc-800/80 shadow-2xl flex flex-col md:flex-row gap-8 items-center md:items-start">
                        {movie.poster_url && (
                            <div className="absolute inset-0 z-0">
                                <Image
                                    src={movie.poster_url}
                                    alt=""
                                    fill
                                    sizes="100vw"
                                    className="object-cover filter blur-2xl scale-125 opacity-40"
                                    aria-hidden="true"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-[#0b0b0d]/90 via-[#0b0b0d]/70 to-[#0b0b0d]/80 backdrop-blur-md" />
                            </div>
                        )}

                        <div className="w-44 sm:w-56 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-500/60 flex-shrink-0 relative z-10 group">
                            {movie.poster_url ? (
                                <Image src={movie.poster_url} alt={movie.title} fill sizes="224px" className="object-cover" priority />
                            ) : (
                                <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-600 text-xs">ไม่มีรูปโปสเตอร์</div>
                            )}
                        </div>

                        <div className="flex-1 space-y-5 relative z-10">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    {movie.is_completed && (
                                        <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded border border-emerald-500/30">
                                            จบแล้ว
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-snug">
                                    {movie.title}{' '}
                                    <span className="text-lg sm:text-xl md:text-2xl text-zinc-300 font-bold">
                                        (ดูครบทุกตอน EP.1-{episodes.length}{movie.is_completed ? ' (จบ)' : ''})
                                    </span>
                                </h1>

                                <div className="flex flex-wrap items-center gap-2 mt-2.5">
                                    {genreTags.map((tag: string, idx: number) => (
                                        <Link
                                            key={idx}
                                            href={`/movies?genre=${encodeURIComponent(tag)}`}
                                            className="bg-zinc-800/90 text-zinc-300 text-[11px] font-bold px-3 py-1 rounded-lg border border-zinc-700/60 backdrop-blur-sm hover:text-white hover:border-amber-500/60 hover:bg-zinc-700/90 transition"
                                        >
                                            {tag}
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-6 text-xs border-y border-zinc-700/60 py-3 bg-black/20 px-4 rounded-xl backdrop-blur-sm">
                                <div>
                                    <p className="text-lg font-black text-white">{episodes.length}</p>
                                    <p className="text-[11px] text-zinc-400">ตอนรวม</p>
                                </div>
                                <div className="border-l border-zinc-700 pl-6">
                                    <p className="text-lg font-black text-white">ตามคลิป</p>
                                    <p className="text-[11px] text-zinc-400">ความยาว</p>
                                </div>
                                <div className="border-l border-zinc-700 pl-6">
                                    <p className="text-lg font-black text-amber-400">{lastWatchedEp}/{episodes.length}</p>
                                    <p className="text-[11px] text-zinc-400">ดูแล้ว</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 pt-1">
                                <Link
                                    href={`/watch?movieId=${movie.id}&ep=${lastWatchedEp}`}
                                    className="bg-amber-500 hover:bg-amber-400 text-white font-extrabold px-6 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-amber-500/30 text-xs sm:text-sm transform active:scale-95"
                                >
                                    <span>▶</span> ดูต่อ EP.{lastWatchedEp}
                                </Link>

                                <Link
                                    href={`/watch?movieId=${movie.id}&ep=1`}
                                    className="bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 font-bold px-5 py-2.5 rounded-xl transition text-xs sm:text-sm border border-zinc-700/60 flex items-center gap-1.5 backdrop-blur-sm"
                                >
                                    <span>⏭</span> เริ่ม EP.1
                                </Link>

                                <button
                                    onClick={toggleBookmark}
                                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition border flex items-center gap-1.5 backdrop-blur-sm ${isBookmarked
                                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                                            : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border-zinc-700/60'
                                        }`}
                                >
                                    <span>{isBookmarked ? '♥' : '♡'}</span>
                                    <span>{isBookmarked ? 'เก็บแล้ว' : 'เก็บเรื่องนี้'}</span>
                                </button>

                                <button
                                    onClick={handleShare}
                                    className="bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 font-bold px-4 py-2.5 rounded-xl transition text-xs border border-zinc-700/60 flex items-center gap-1.5 backdrop-blur-sm"
                                >
                                    <span>↗</span> แชร์
                                </button>
                            </div>

                            <p className="text-[11px] text-zinc-400">
                                ดูไปแล้ว {lastWatchedEp} จาก {episodes.length} ตอน
                            </p>
                        </div>
                    </section>

                    {/* MAIN CONTENT GRID */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        <div className="lg:col-span-8 space-y-4">
                            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                                <h2 className="text-lg font-black text-white flex items-center gap-2">
                                    รายชื่อตอน {movie.title}
                                </h2>
                                <button
                                    onClick={() => setSortAsc(!sortAsc)}
                                    className="text-xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1"
                                >
                                    <span>เรียง: {sortAsc ? 'EP.1 → ตอนล่าสุด 💥' : 'ตอนล่าสุด → EP.1 🔃'}</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                {sortedEpisodes.map((ep) => (
                                    <Link
                                        key={ep.id}
                                        href={`/watch?movieId=${movie.id}&ep=${ep.episode_number}`}
                                        className="group flex flex-col"
                                    >
                                        <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 group-hover:border-amber-500/80 transition duration-300 shadow-md">
                                            {movie.poster_url ? (
                                                <Image
                                                    src={movie.poster_url}
                                                    alt={`EP.${ep.episode_number}`}
                                                    fill
                                                    sizes="(max-width: 640px) 45vw, 180px"
                                                    className="object-cover group-hover:scale-105 transition duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-zinc-700 text-xs">
                                                    EP.{ep.episode_number}
                                                </div>
                                            )}

                                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center pl-0.5 text-xs shadow-lg">
                                                    ▶
                                                </div>
                                            </div>
                                        </div>

                                        <span className="mt-1.5 text-xs font-bold text-zinc-300 group-hover:text-amber-400 transition">
                                            EP.{ep.episode_number}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 space-y-2">
                                <h3 className="text-sm font-bold text-white">เรื่องย่อ {movie.title}</h3>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    {movie.description || 'ยังไม่มีรายละเอียดเรื่องย่อสำหรับละครเรื่องนี้'}
                                </p>
                            </div>

                            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 space-y-3">
                                <h3 className="text-sm font-bold text-white border-b border-zinc-800 pb-2">ข้อมูลเรื่อง</h3>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">สถานะ</span>
                                        <span className="text-emerald-400 font-bold">{movie.is_completed ? 'จบแล้ว' : 'ยังไม่จบ'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">จำนวนตอน</span>
                                        <span className="text-zinc-200 font-bold">{episodes.length} ตอน</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">แนวเรื่อง</span>
                                        <span className="text-zinc-200 font-bold">{genreTags.join(', ')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">ผู้สร้าง</span>
                                        <span className="text-amber-400 font-bold">Movies AI</span>
                                    </div>
                                </div>
                            </div>

                            {similarMovies.length > 0 && (
                                <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 space-y-3">
                                    <h3 className="text-sm font-bold text-white">ดูต่อเรื่องคล้ายกัน</h3>
                                    <div className="space-y-3">
                                        {similarMovies.map((sim) => (
                                            <Link
                                                key={sim.id}
                                                href={`/movie-detail?movieId=${sim.id}`}
                                                className="flex items-center gap-3 group"
                                            >
                                                <div className="w-12 h-16 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0 relative">
                                                    <Image src={sim.poster_url} alt={sim.title} fill sizes="48px" className="object-cover group-hover:scale-105 transition" />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <h4 className="text-xs font-bold text-zinc-200 group-hover:text-amber-400 transition truncate">
                                                        {sim.title}
                                                    </h4>
                                                    <p className="text-[10px] text-zinc-500 mt-0.5">
                                                        {sim.genre || 'ซีรีส์สั้น'}
                                                    </p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* FAQ — คำถามที่พบบ่อย (SEO) */}
                    <section className="space-y-3">
                        <h2 className="text-lg font-black text-white border-b border-zinc-800 pb-3">
                            คำถามที่พบบ่อยเกี่ยวกับ {movie.title}
                        </h2>
                        <div className="space-y-2.5 max-w-3xl">
                            {[
                                {
                                    q: `${movie.title} ทั้งหมดกี่ตอน เรื่องนี้จบหรือยัง?`,
                                    a: movie.is_completed
                                        ? `${movie.title} มีทั้งหมด ${episodes.length} ตอน และเรื่องนี้จบครบทุกตอนแล้ว เริ่มดูจาก EP.1 ได้ทันที`
                                        : `${movie.title} มีทั้งหมด ${episodes.length} ตอนตอนนี้ ยังมีอัปเดตตอนใหม่เรื่อย ๆ ติดตามได้ที่หน้านี้`,
                                },
                                {
                                    q: `เริ่มดู ${movie.title} ฟรีได้เลยไหม?`,
                                    a: 'ได้เลย กดปุ่ม ▶ ดูต่อ EP ด้านบนในหน้านี้ เริ่มรับชมจาก EP.1 ได้ทันที พร้อมพากย์ไทยคุณภาพคมชัด',
                                },
                                {
                                    q: 'ดูค้างไว้แล้วจะกลับมาดูต่อจากตอนที่ค้างยังไง?',
                                    a: `ระบบจำตอนล่าสุดที่คุณดูไว้ให้อัตโนมัติ กดปุ่ม ▶ ดูต่อ EP.${lastWatchedEp} ด้านบน มันจะเปิดตรงตอนที่คุณดูค้างไว้ทันที`,
                                },
                                {
                                    q: `ดู ${movie.title} บนมือถือได้ไหม?`,
                                    a: 'ดูได้ทุกอุปกรณ์ ทั้งมือถือ แท็บเล็ต และคอมพิวเตอร์ แนวตั้งเต็มจอ เหมือนดูวิดีโอสั้นในโซเชียล เปิดผ่านเบราว์เซอร์โดยไม่ต้องติดตั้งแอป',
                                },
                                {
                                    q: 'อยากดูเรื่องอื่นแนวเดียวกัน ต้องค้นยังไง?',
                                    a: 'กดที่แท็กแนวเรื่องด้านบนได้เลย ระบบจะพาไปหน้ารวมเรื่องแนวนั้น หรือเลื่อนไปดูต่อเรื่องคล้ายกัน ด้านขวาของหน้านี้',
                                },
                            ].map((item, i) => (
                                <details
                                    key={i}
                                    className="group bg-zinc-900/50 border border-zinc-800/80 rounded-xl overflow-hidden"
                                >
                                    <summary className="flex items-center justify-between gap-3 text-sm font-bold text-zinc-200 px-4 py-3 cursor-pointer list-none hover:text-white transition">
                                        <span>{item.q}</span>
                                        <span className="text-amber-400 text-base leading-none shrink-0 transition-transform group-open:rotate-45">
                                            ＋
                                        </span>
                                    </summary>
                                    <p className="text-xs text-zinc-400 leading-relaxed px-4 pb-3.5 pt-1">{item.a}</p>
                                </details>
                            ))}
                        </div>
                    </section>
                </main>
            </div>

            {/* Comments Section */}
            <section className="max-w-7xl mx-auto px-4 lg:px-8 pb-10">
                <Comments movieId={movieId || ''} />
            </section>

            {/* Footer Component ด้านล่างสุด */}
            <Footer />
        </div>
    )
}

export default MovieDetailContent