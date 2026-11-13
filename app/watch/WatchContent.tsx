'use client'

import { useEffect, useState, useRef } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { saveWatchProgress } from '@/lib/history'
import { recordView } from '@/lib/views'

interface WatchContentProps {
    movieId: string | null
    initialEp: number | null
}

function WatchContent({ movieId, initialEp }: WatchContentProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null)

    const [user, setUser] = useState<User | null>(null)
    const [isVip, setIsVip] = useState<boolean>(false)
    const [movie, setMovie] = useState<any>(null)
    const [episodes, setEpisodes] = useState<any[]>([])
    const [currentEp, setCurrentEp] = useState<any>(null)
    const [otherMovies, setOtherMovies] = useState<any[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [errorMsg, setErrorMsg] = useState<string>('')
    const [autoPlayNext, setAutoPlayNext] = useState<boolean>(true)
    const [watchedEpIds, setWatchedEpIds] = useState<Set<string>>(new Set())
    // เก็บ id ของตอนที่เล่นวิดีโอไม่สำเร็จ (ลิงก์ต้นทางมักมีอายุจำกัด)
    const [failedEpId, setFailedEpId] = useState<string | null>(null)

    useEffect(() => {
        checkUserAndAccess()
        if (movieId) {
            fetchMovieAndEpisodes(movieId)
            fetchOtherMovies(movieId)
        }
    }, [movieId, initialEp])

    // อัปเดตประวัติการดู (localStorage + Supabase ถ้าล็อกอินอยู่)
    useEffect(() => {
        if (movie && currentEp) {
            saveWatchProgress({
                user,
                movie,
                episodeNumber: currentEp.episode_number,
                totalEpisodes: episodes.length,
            })
            setWatchedEpIds(prev => new Set(prev).add(currentEp.id))
        }
    }, [currentEp, movie, episodes, user])

    // สั่งให้วิดีโอเล่นอัตโนมัติเมื่อเปลี่ยนตอน + บันทึกยอดวิว (throttle 1 ครั้ง/6 ชม.ต่อเรื่อง)
    useEffect(() => {
        if (videoRef.current && currentEp?.stream_path) {
            videoRef.current.play().catch(() => {
                // เบราว์เซอร์อาจบล็อก Auto-play แบบมีเสียง ให้รอผู้ใช้กดเล่น
            })
        }
        if (movie?.id) {
            recordView(movie.id)
        }
    }, [currentEp, movie?.id])

    // ฟังก์ชันสำหรับหยุดและทำลายแทรกวิดีโอ/เสียงแบบเด็ดขาด 100%
    const stopAndClearVideo = () => {
        if (videoRef.current) {
            videoRef.current.pause()
            videoRef.current.currentTime = 0
            videoRef.current.src = ''
            videoRef.current.load()
        }
    }

    // สั่งหยุดทันทีเมื่อ Unmount หรือเปลี่ยนหน้า
    useEffect(() => {
        return () => {
            stopAndClearVideo()
        }
    }, [])

    const checkUserAndAccess = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
            const { data: sub } = await supabase
                .from('subscriptions')
                .select('status')
                .eq('user_id', user.id)
                .maybeSingle()

            if (sub && sub.status === 'active') {
                setIsVip(true)
            }
        }
    }

    const fetchMovieAndEpisodes = async (id: string) => {
        setLoading(true)
        try {
            const { data: movieData, error: movieError } = await supabase
                .from('movies')
                .select('*')
                .eq('id', id)
                .maybeSingle()

            if (movieError || !movieData) {
                setErrorMsg('ไม่พบข้อมูลภาพยนตร์เรื่องนี้ในระบบ')
                setLoading(false)
                return
            }
            setMovie(movieData)

            const { data: epData, error: epError } = await supabase
                .from('episodes')
                .select('*')
                .eq('movie_id', id)
                .order('episode_number', { ascending: true })

            if (epError || !epData || epData.length === 0) {
                const fallback = {
                    id: 'fallback-ep',
                    movie_id: id,
                    title: 'ตอนที่ 1 (ตัวอย่าง)',
                    episode_number: 1,
                    access_level: 'free',
                    stream_path: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
                }
                setEpisodes([fallback])
                setCurrentEp(fallback)
            } else {
                setEpisodes(epData)
                // เคารพค่า ?ep= ที่ส่งมาจากหน้าดูต่อ ถ้าไม่มีค่อยเริ่มตอนแรก
                const requested = initialEp ? epData.find((ep) => ep.episode_number === initialEp) : null
                setCurrentEp(requested || epData[0])
            }
        } catch (err) {
            console.error(err)
            setErrorMsg('เกิดข้อผิดพลาดในการโหลดข้อมูล')
        } finally {
            setLoading(false)
        }
    }

    const fetchOtherMovies = async (currentMovieId: string) => {
        const { data } = await supabase
            .from('movies')
            .select('*')
            .neq('id', currentMovieId)
            .limit(6)
        if (data) setOtherMovies(data)
    }

    const handleVideoEnded = () => {
        if (!autoPlayNext || !currentEp) return
        const currentIndex = episodes.findIndex(e => e.id === currentEp.id)
        const nextEp = episodes[currentIndex + 1]

        if (nextEp) {
            setCurrentEp(nextEp)
        }
    }

    const handleToggleFullscreen = () => {
        if (videoRef.current) {
            if (document.fullscreenElement) {
                document.exitFullscreen()
            } else {
                videoRef.current.requestFullscreen()
            }
        }
    }

    const handleUpgradeVip = async () => {
        if (!user) return alert('กรุณาล็อกอินก่อนครับ')

        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return alert('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่')

        try {
            const res = await fetch('/api/vip/activate', {
                method: 'POST',
                headers: { Authorization: `Bearer ${session.access_token}` },
            })
            const body = await res.json().catch(() => ({}))

            if (!res.ok) {
                alert(body?.error || 'อัปเกรดสมาชิกไม่สำเร็จ กรุณาลองใหม่')
                return
            }

            setIsVip(true)
            alert('จำลองการชำระเงินสำเร็จ! คุณเป็นสมาชิก VIP เรียบร้อยแล้ว')
        } catch {
            alert('เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ กรุณาลองใหม่')
        }
    }

    if (!movieId) {
        return (
            <div className="min-h-screen bg-[#0b0b0d] text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
                <p className="text-red-400 text-sm font-bold">ไม่พบรหัสภาพยนตร์ (movieId) ในลิงก์</p>
                <Link href="/" className="bg-amber-500 text-black px-4 py-2 rounded-xl font-bold text-xs">
                    กลับสู่หน้าแรก
                </Link>
            </div>
        )
    }

    if (loading) {
        return <div className="min-h-screen bg-[#0b0b0d] text-white flex items-center justify-center text-xs animate-pulse">กำลังโหลดวิดีโอ...</div>
    }

    if (errorMsg) {
        return (
            <div className="min-h-screen bg-[#0b0b0d] text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
                <p className="text-red-400 text-sm font-bold">{errorMsg}</p>
                <Link href="/" onClick={stopAndClearVideo} className="bg-amber-500 text-black px-4 py-2 rounded-xl font-bold text-xs">
                    กลับสู่หน้าแรก
                </Link>
            </div>
        )
    }

    const isLocked = currentEp?.access_level === 'early_access' && !isVip
    const videoFailed = Boolean(currentEp) && failedEpId === currentEp?.id
    const currentIndex = episodes.findIndex(e => e.id === currentEp?.id)
    const genreTags = movie?.genre ? movie.genre.split(',').map((t: string) => t.trim()) : []

    return (
        <div className="min-h-screen bg-[#0b0b0d] text-white font-sans selection:bg-amber-500 selection:text-black flex flex-col justify-between">

            <div>
                <Header activeGenre={genreTags[0] ?? null} onNavigate={stopAndClearVideo} />

                <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-8">

                    {/* Breadcrumb path */}
                    <div className="text-xs text-zinc-400 flex items-center gap-2 font-medium">
                        <Link href="/" onClick={stopAndClearVideo} className="hover:text-white transition">หน้าแรก</Link>
                        <span>&gt;</span>
                        <span className="text-zinc-200 truncate">{movie?.title}</span>
                    </div>

                    {/* Main Grid: Player + Episode Controls */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                        {/* Left Column: 9:16 HTML5 Video Player */}
                        <div className="lg:col-span-5 flex justify-center">
                            <div className="w-full max-w-[360px] aspect-[9/16] bg-black rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl relative flex items-center justify-center">
                                {isLocked ? (
                                    <div className="w-full h-full bg-zinc-900/95 p-6 flex flex-col items-center justify-center text-center z-30 space-y-4">
                                        <div className="text-5xl">🔒</div>
                                        <h3 className="text-lg font-extrabold text-amber-400">EP.{currentEp?.episode_number} เฉพาะสมาชิก VIP</h3>
                                        <p className="text-xs text-zinc-400 leading-relaxed">
                                            ตอนนี้เป็นตอนพิเศษ Early Access สมัคร VIP เพื่อปลดล็อกดูทันที
                                        </p>
                                        <button
                                            onClick={handleUpgradeVip}
                                            className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-600 text-black font-extrabold rounded-2xl shadow-xl hover:brightness-110 transition text-sm"
                                        >
                                            สมัครสมาชิก VIP รับชมได้ทันที
                                        </button>
                                    </div>
                                ) : currentEp?.stream_path ? (
                                    <div className="w-full h-full relative overflow-hidden bg-black flex items-center justify-center">
                                        <video
                                            ref={videoRef}
                                            key={currentEp.id || currentEp.stream_path}
                                            className="w-full h-full object-cover"
                                            controls
                                            autoPlay
                                            playsInline
                                            preload="metadata"
                                            controlsList="nodownload"
                                            src={currentEp.stream_path}
                                            onEnded={handleVideoEnded}
                                            onError={() => setFailedEpId(currentEp.id)}
                                        >
                                            เบราว์เซอร์ของคุณไม่รองรับการเล่นวิดีโอ
                                        </video>

                                        {videoFailed && (
                                            <div className="absolute inset-0 z-20 bg-zinc-950/92 p-6 flex flex-col items-center justify-center text-center space-y-3">
                                                <div className="text-4xl">📵</div>
                                                <h3 className="text-sm font-extrabold text-white">เล่นวิดีโอตอนนี้ไม่ได้</h3>
                                                <p className="text-[11px] text-zinc-400 leading-relaxed">
                                                    ลิงก์วิดีโอจากต้นทางอาจหมดอายุแล้ว (ลิงก์มีอายุจำกัด)
                                                    ลองเลือกตอนอื่น หรือให้แอดมินรันสคริปต์ดึงลิงก์ใหม่
                                                </p>
                                                <a
                                                    href={currentEp.stream_path}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold px-4 py-2 rounded-xl border border-zinc-700/60 transition"
                                                >
                                                    เปิดลิงก์วิดีโอในแท็บใหม่
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-zinc-500 text-xs">ไม่พบไฟล์วิดีโอในตอนนี้</div>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Title, Buttons, Grid Selector & Description */}
                        <div className="lg:col-span-7 space-y-6">

                            {/* Title & Action Bar */}
                            <div className="space-y-4">
                                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                                    {movie?.title} <span className="text-amber-500">EP.{currentEp?.episode_number}</span>
                                </h1>

                                <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
                                    <div className="flex items-center gap-2">
                                        <button
                                            disabled={currentIndex <= 0}
                                            onClick={() => setCurrentEp(episodes[currentIndex - 1])}
                                            className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 px-4 py-2 rounded-xl transition flex items-center gap-1.5"
                                        >
                                            ⏮ ตอนก่อน
                                        </button>
                                        <button
                                            disabled={currentIndex >= episodes.length - 1}
                                            onClick={() => setCurrentEp(episodes[currentIndex + 1])}
                                            className="bg-amber-500 hover:bg-amber-400 text-white disabled:opacity-40 px-5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                                        >
                                            ตอนถัดไป ⏭
                                        </button>
                                        <button
                                            onClick={handleToggleFullscreen}
                                            className="bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 px-3.5 py-2 rounded-xl transition border border-zinc-700/60"
                                        >
                                            ⛶ เต็มจอ
                                        </button>
                                    </div>

                                    <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300 select-none">
                                        <input
                                            type="checkbox"
                                            checked={autoPlayNext}
                                            onChange={(e) => setAutoPlayNext(e.target.checked)}
                                            className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                                        />
                                        <span>เล่นตอนถัดไปอัตโนมัติ</span>
                                    </label>
                                </div>
                            </div>

                            {/* Grid เลือกตอน (Episode Matrix) */}
                            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-5 md:p-6 space-y-4">
                                <div className="flex items-center justify-between text-xs font-bold text-zinc-400">
                                    <span>เลือกตอน ({episodes.length} ตอน)</span>
                                    <span className="text-amber-400">🔒 ตอนพิเศษสำหรับ VIP</span>
                                </div>

                                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-64 overflow-y-auto pr-1">
                                    {episodes.map((ep) => {
                                        const isEpLocked = ep.access_level === 'early_access' && !isVip
                                        const isSelected = currentEp?.id === ep.id
                                        const isWatched = watchedEpIds.has(ep.id)

                                        return (
                                            <button
                                                key={ep.id}
                                                onClick={() => setCurrentEp(ep)}
                                                className={`relative py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center ${isSelected
                                                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 ring-2 ring-amber-400'
                                                        : isEpLocked
                                                            ? 'bg-zinc-800/50 text-zinc-500 hover:bg-zinc-700/60'
                                                            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                                                    }`}
                                            >
                                                {ep.episode_number}

                                                {isEpLocked ? (
                                                    <span className="absolute -top-1 -right-1 text-[8px] bg-amber-500 text-black px-1 rounded-full font-bold">
                                                        🔒
                                                    </span>
                                                ) : isWatched && !isSelected ? (
                                                    <span className="absolute top-0.5 right-1 text-[9px] text-emerald-400 font-bold">
                                                        ✓
                                                    </span>
                                                ) : null}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* เรื่องย่อ */}
                            <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-3xl p-5 space-y-2">
                                <h3 className="text-sm font-bold text-zinc-200">เรื่องย่อ {movie?.title}</h3>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    {movie?.description || 'ยังไม่มีคำอธิบายเรื่องย่อสำหรับภาพยนตร์เรื่องนี้'}
                                </p>
                            </div>

                        </div>
                    </div>

                    {/* SECTION: เรื่องอื่นที่น่าดู */}
                    {otherMovies.length > 0 && (
                        <section className="space-y-4 pt-6 border-t border-zinc-800/60">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-black text-white flex items-center gap-2">
                                    <span className="text-amber-500">🔥</span> เรื่องอื่นที่น่าดู
                                </h3>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {otherMovies.map((m) => (
                                    <Link key={m.id} href={`/title/${encodeURIComponent(m.title)}/watch`} onClick={stopAndClearVideo} className="group flex flex-col">
                                        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800/90 group-hover:border-amber-500/70 transition duration-300 shadow-xl">
                                            {m.poster_url ? (
                                                <Image
                                                    src={m.poster_url}
                                                    alt={m.title}
                                                    fill
                                                    sizes="(max-width: 640px) 45vw, 15vw"
                                                    className="object-cover group-hover:scale-105 transition duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-zinc-700 text-xs">ไม่มีรูป</div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                                                <span className="text-[10px] font-bold text-amber-400 bg-black/60 px-2 py-0.5 rounded backdrop-blur">
                                                    ดูเรื่องนี้ →
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-2 px-0.5">
                                            <h4 className="text-xs sm:text-sm font-bold text-zinc-200 group-hover:text-amber-400 transition truncate">
                                                {m.title}
                                            </h4>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                </main>
            </div>

            {/* Footer Component ด้านล่างสุด */}
            <Footer />
        </div>
    )
}

export default WatchContent