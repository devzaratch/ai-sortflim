'use client'

import { useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { fetchAllMovies, fetchEpisodeCounts, fetchRecommendations } from '@/lib/data'
import { clearWatchHistory, fetchServerHistory, readLocalHistory } from '@/lib/history'
import { fetchViewCounts, formatViews } from '@/lib/views'
import type { ContinueWatchingItem, Movie } from '@/lib/types'

// รายชื่อหมวดหมู่ทั้งหมดสำหรับสร้าง Genre Cards
const ALL_GENRES = [
  'รักวัยเรียน', 'โรแมนติก', 'ครอบครัว', 'แก้แค้น', 'ดราม่า', 'ย้อนยุค',
  'คุณธรรม', 'คอมเมดี้', 'แอ็คชั่น', 'วาย', 'ท่านประธาน', 'ผี',
  'พลิกชีวิต', 'แฟนตาซี'
]

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [movies, setMovies] = useState<Movie[]>([])
  const [epCounts, setEpCounts] = useState<{ [key: string]: number }>({})
  const [loading, setLoading] = useState<boolean>(true)
  const [activeIndex, setActiveIndex] = useState<number>(0)
  const [continueList, setContinueList] = useState<ContinueWatchingItem[]>([])
  const [totalEpisodesCount, setTotalEpisodesCount] = useState<number>(0)
  const [formattedDate, setFormattedDate] = useState<string>('')
  const [recommendations, setRecommendations] = useState<Movie[]>([])
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({})

  // แนะนำเรื่องที่คล้ายกับเรื่องล่าสุดที่ผู้ใช้ดู (อิงจาก genre)
  useEffect(() => {
    const history = readLocalHistory()
    if (!user || history.length === 0) {
      setRecommendations([])
      return
    }
    let cancelled = false
    fetchRecommendations(history[0].movieId).then((recs) => {
      if (!cancelled) setRecommendations(recs)
    })
    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    checkUserAndHistory()
    fetchMoviesAndStats()

    setFormattedDate(
      new Date().toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    )
  }, [])

  // ล็อคให้สไลด์ Hero แสดงเฉพาะ 5 เรื่องล่าสุด
  const heroMovies = movies.slice(0, 5)

  useEffect(() => {
    if (heroMovies.length <= 1) return
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % heroMovies.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [heroMovies.length])

  const checkUserAndHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    if (user) {
      // ดึงประวัติ "ดูต่อ" จากตาราง watch_history ของผู้ใช้คนนี้
      setContinueList(await fetchServerHistory(user.id))
    } else {
      // ถ้ายังไม่ล็อกอิน ให้ดึงจาก localStorage
      setContinueList(readLocalHistory())
    }
  }

  const fetchMoviesAndStats = async () => {
    setLoading(true)
    try {
      const moviesData = await fetchAllMovies()
      setMovies(moviesData)

      // นับจำนวนตอนทั้งหมด + จำนวนตอนต่อเรื่อง (แบ่งหน้าจนครบ)
      const counts = await fetchEpisodeCounts()
      setEpCounts(counts)
      setTotalEpisodesCount(Object.values(counts).reduce((sum, n) => sum + n, 0))

      // ยอดวิวรวมของแต่ละเรื่อง (ถ้ายังไม่ได้รัน supabase/views.sql จะได้ค่าว่าง แล้วไม่พัง)
      setViewCounts(await fetchViewCounts())
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleClearHistory = async () => {
    await clearWatchHistory(user)
    setContinueList([])
  }

  const activeMovie = heroMovies.length > 0 ? heroMovies[activeIndex] : null
  const prevIndex = heroMovies.length > 0 ? (activeIndex - 1 + heroMovies.length) % heroMovies.length : 0
  const nextIndex = heroMovies.length > 0 ? (activeIndex + 1) % heroMovies.length : 0

  // Top 10 เรียงตามยอดวิวจริงจากตาราง view_counts — ถ้ายังไม่มีข้อมูลวิว แสดงเรื่องล่าสุดแทน
  const top10Movies = useMemo(() => {
    if (Object.keys(viewCounts).length === 0) return movies.slice(0, 10)
    return [...movies]
      .sort((a, b) => (viewCounts[b.id] || 0) - (viewCounts[a.id] || 0))
      .slice(0, 10)
  }, [movies, viewCounts])

  // กรองซีรีส์ตามหมวดหมู่จากข้อมูลจริงใน Supabase
  const dramaMovies = movies.filter(m => m.genre?.includes('ดราม่า'))
  const romanceMovies = movies.filter(m => m.genre?.includes('โรแมนติก'))
  const familyMovies = movies.filter(m => m.genre?.includes('ครอบครัว'))
  const periodMovies = movies.filter(m => m.genre?.includes('ย้อนยุค'))
  const revengeMovies = movies.filter(m => m.genre?.includes('แก้แค้น'))
  const completedMovies = movies.filter(m => m.is_completed === true)

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white font-sans selection:bg-amber-500 selection:text-[#1c1917]">

      <Header isHome />

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-10">

        {/* Featured Hero Carousel */}
        {activeMovie && (
          <section className="relative w-full rounded-3xl bg-gradient-to-b from-[#17110a] to-[#0a0a0b] p-6 sm:p-10 md:p-12 overflow-hidden border border-white/[0.07] shadow-2xl">
            {/* ambient amber glow */}
            <div aria-hidden="true" className="absolute -top-44 left-1/2 -translate-x-1/2 w-[560px] h-[360px] rounded-full bg-amber-500/20 blur-[90px] pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[360px] relative">

              <div className="lg:col-span-7 space-y-4 z-10 flex flex-col justify-center">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-amber-500/15 text-amber-400 border border-amber-500/35 text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                    🔥 กำลังมาแรง • เรื่องเด่นแนะนำ
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
                    href={`/movie-detail?movieId=${activeMovie.id}`}
                    className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#1c1917] font-extrabold px-7 py-3 rounded-full transition flex items-center gap-2 shadow-[0_6px_28px_rgba(245,158,11,0.35)] hover:shadow-[0_10px_36px_rgba(245,158,11,0.5)] hover:-translate-y-0.5 text-xs sm:text-sm active:scale-95"
                  >
                    <span>▶</span> ดู EP.1 ฟรี
                  </Link>

                  <Link
                    href={`/movie-detail?movieId=${activeMovie.id}`}
                    className="bg-white/[0.06] hover:bg-[#18181b] text-zinc-200 font-bold px-6 py-3 rounded-full transition text-xs sm:text-sm border border-white/[0.07] hover:border-amber-500/35"
                  >
                    รายชื่อตอน
                  </Link>
                </div>

                <div className="flex items-center gap-2 pt-4">
                  {heroMovies.map((_, idx) => (
                    <button
                      key={idx}
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
                        className="object-cover"
                      />
                    </div>
                  )}

                </div>
              </div>

            </div>
          </section>
        )}

        {/* SEO Info Headline */}
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
            ดูละคร AI ละครสั้น AI ซีรีส์ AI แนวตั้ง ครบทุกตอน
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            รวมละคร AI พากย์ไทย ทั้งหมด {movies.length} เรื่อง {totalEpisodesCount} ตอน ทั้งวาย ย้อนยุค โรแมนติก แฟนตาซี จัดเรียงตอนตั้งแต่ EP.1 ดูฟรี ไม่ต้องสมัครสมาชิก {formattedDate ? `• อัปเดตล่าสุด ${formattedDate}` : ''}
          </p>
        </div>

        {/* SECTION: ดูต่อจากที่ค้างไว้ */}
        {continueList.length > 0 && (
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
                <Link key={item.movieId} href={`/title/${encodeURIComponent(item.movieTitle)}`} className="group flex flex-col">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#18181b] border border-white/[0.07] group-hover:border-amber-500/40 group-hover:-translate-y-1 transition duration-300 shadow-lg">
                    {item.posterUrl ? (
                      <Image src={item.posterUrl} alt={item.movieTitle} fill sizes="(max-width: 640px) 45vw, 15vw" className="object-cover group-hover:scale-105 transition duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-700 text-xs">ไม่มีรูป</div>
                    )}

                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-amber-400 text-[#1c1917] flex items-center justify-center pl-0.5 shadow-[0_0_20px_rgba(245,158,11,0.45)] group-hover:scale-110 transition">
                        ▶
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
        )}

        {/* SECTION: แนะนำสำหรับคุณ (จากประวัติการดู) */}
        {recommendations.length > 0 && (
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
                <Link key={movie.id} href={`/title/${encodeURIComponent(movie.title)}`} className="group flex flex-col">
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
        )}

        {/* SECTION: อัปเดตล่าสุด */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <span className="sec-bar" aria-hidden="true" /> อัปเดตล่าสุด
            </h3>
            <Link href="/movies" className="text-xs text-zinc-400 hover:text-amber-400 transition">
              ดูทั้งหมด {movies.length} เรื่อง &gt;
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-20 text-zinc-500 text-xs animate-pulse">กำลังโหลดข้อมูล...</div>
          ) : movies.length === 0 ? (
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-500 text-xs">
              ยังไม่มีข้อมูลซีรีส์ในระบบ Supabase
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
              {movies.slice(0, 6).map((movie) => (
                <Link key={movie.id} href={`/title/${encodeURIComponent(movie.title)}`} className="group flex flex-col">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#18181b] border border-white/[0.07] group-hover:border-amber-500/40 group-hover:-translate-y-1 transition duration-300 shadow-xl">

                    {movie.is_completed && (
                      <div className="absolute top-2 right-2 z-10 bg-emerald-500/90 text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                        จบแล้ว
                      </div>
                    )}

                    {movie.poster_url ? (
                      <Image
                        src={movie.poster_url}
                        alt={movie.title}
                        fill sizes="(max-width: 640px) 45vw, 15vw"
                        className="object-cover group-hover:scale-105 transition duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-700 text-xs">ไม่มีรูปโปสเตอร์</div>
                    )}

                    <div className="absolute bottom-2 left-2 z-10 bg-black/70 backdrop-blur-sm text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                      {epCounts[movie.id] || 0} ตอน
                    </div>
                  </div>

                  <div className="mt-2.5 px-0.5">
                    <h4 className="text-xs sm:text-sm font-bold text-zinc-200 group-hover:text-amber-400 transition truncate">
                      {movie.title}
                    </h4>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* SECTION: Top 10 ละคร AI ประจำสัปดาห์ */}
        {top10Movies.length > 0 && (
          <section className="space-y-4 pt-4">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <span className="sec-bar" aria-hidden="true" /> ยอดนิยม Top 10
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
              {top10Movies.map((movie, index) => {
                const rank = index + 1
                return (
                  <Link key={movie.id} href={`/title/${encodeURIComponent(movie.title)}`} className="group flex flex-col relative">
                    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#18181b] border border-white/[0.07] group-hover:border-amber-500/40 group-hover:-translate-y-1 transition duration-300 shadow-xl">

                      {movie.is_completed && (
                        <div className="absolute top-2 right-2 z-10 bg-emerald-500/90 text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                          จบแล้ว
                        </div>
                      )}

                      {movie.poster_url ? (
                        <Image
                          src={movie.poster_url}
                          alt={movie.title}
                          fill sizes="(max-width: 640px) 45vw, 15vw"
                          className="object-cover group-hover:scale-105 transition duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-700 text-xs">ไม่มีรูป</div>
                      )}

                      <div className="absolute -bottom-3 -left-2 z-20 pointer-events-none select-none">
                        <span className="text-6xl md:text-7xl font-black italic text-zinc-300 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] stroke-black">
                          {rank}
                        </span>
                      </div>

                      <div className="absolute bottom-2 right-2 z-10 bg-black/70 backdrop-blur-sm text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                        {epCounts[movie.id] || 0} ตอน
                      </div>
                    </div>

                    <div className="mt-4 px-0.5 space-y-0.5">
                      <h4 className="text-xs sm:text-sm font-bold text-zinc-200 group-hover:text-amber-400 transition truncate">
                        {movie.title}
                      </h4>
                      <p className="text-[10px] text-zinc-500 truncate">
                        {movie.genre || 'ซีรีส์สั้น AI'} · {formatViews(viewCounts[movie.id] || 0)} วิว
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* SECTION 1: ละคร AI แนวดราม่า */}
        {dramaMovies.length > 0 && (
          <section className="space-y-4 pt-4 border-t border-white/[0.06]">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <span className="sec-bar" aria-hidden="true" /> ละคร AI แนวดราม่า
              </h3>
              <Link href="/movies?genre=ดราม่า" className="text-xs text-zinc-400 hover:text-amber-400 transition">
                ดูทั้งหมด {dramaMovies.length} เรื่อง &gt;
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {dramaMovies.slice(0, 7).map((movie) => (
                <Link key={movie.id} href={`/title/${encodeURIComponent(movie.title)}`} className="group flex flex-col">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#18181b] border border-white/[0.07] group-hover:border-amber-500/40 group-hover:-translate-y-1 transition duration-300 shadow-xl">

                    {movie.is_completed && (
                      <div className="absolute top-2 right-2 z-10 bg-emerald-500/90 text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                        จบแล้ว
                      </div>
                    )}

                    {movie.poster_url ? (
                      <Image
                        src={movie.poster_url}
                        alt={movie.title}
                        fill sizes="(max-width: 640px) 45vw, 15vw"
                        className="object-cover group-hover:scale-105 transition duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-700 text-xs">ไม่มีรูป</div>
                    )}

                    <div className="absolute bottom-2 left-2 z-10 bg-black/70 backdrop-blur-sm text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                      {epCounts[movie.id] || 0} ตอน
                    </div>
                  </div>

                  <div className="mt-2.5 px-0.5 space-y-0.5">
                    <h4 className="text-xs sm:text-sm font-bold text-zinc-200 group-hover:text-amber-400 transition truncate">
                      {movie.title}
                    </h4>
                    <p className="text-[10px] text-zinc-500 truncate">
                      {movie.genre || 'ดราม่า'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 2: ละคร AI โรแมนติก */}
        {romanceMovies.length > 0 && (
          <section className="space-y-4 pt-4 border-t border-white/[0.06]">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <span className="sec-bar" aria-hidden="true" /> ละคร AI โรแมนติก
              </h3>
              <Link href="/movies?genre=โรแมนติก" className="text-xs text-zinc-400 hover:text-amber-400 transition">
                ดูทั้งหมด {romanceMovies.length} เรื่อง &gt;
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {romanceMovies.slice(0, 7).map((movie) => (
                <Link key={movie.id} href={`/title/${encodeURIComponent(movie.title)}`} className="group flex flex-col">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#18181b] border border-white/[0.07] group-hover:border-amber-500/40 group-hover:-translate-y-1 transition duration-300 shadow-xl">

                    {movie.is_completed && (
                      <div className="absolute top-2 right-2 z-10 bg-emerald-500/90 text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                        จบแล้ว
                      </div>
                    )}

                    {movie.poster_url ? (
                      <Image
                        src={movie.poster_url}
                        alt={movie.title}
                        fill sizes="(max-width: 640px) 45vw, 15vw"
                        className="object-cover group-hover:scale-105 transition duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-700 text-xs">ไม่มีรูป</div>
                    )}

                    <div className="absolute bottom-2 left-2 z-10 bg-black/70 backdrop-blur-sm text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                      {epCounts[movie.id] || 0} ตอน
                    </div>
                  </div>

                  <div className="mt-2.5 px-0.5 space-y-0.5">
                    <h4 className="text-xs sm:text-sm font-bold text-zinc-200 group-hover:text-amber-400 transition truncate">
                      {movie.title}
                    </h4>
                    <p className="text-[10px] text-zinc-500 truncate">
                      {movie.genre || 'โรแมนติก'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 3: ละคร AI แนวครอบครัว */}
        {familyMovies.length > 0 && (
          <section className="space-y-4 pt-4 border-t border-white/[0.06]">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <span className="sec-bar" aria-hidden="true" /> ละคร AI แนวครอบครัว
              </h3>
              <Link href="/movies?genre=ครอบครัว" className="text-xs text-zinc-400 hover:text-amber-400 transition">
                ดูทั้งหมด {familyMovies.length} เรื่อง &gt;
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {familyMovies.slice(0, 7).map((movie) => (
                <Link key={movie.id} href={`/title/${encodeURIComponent(movie.title)}`} className="group flex flex-col">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#18181b] border border-white/[0.07] group-hover:border-amber-500/40 group-hover:-translate-y-1 transition duration-300 shadow-xl">

                    {movie.is_completed && (
                      <div className="absolute top-2 right-2 z-10 bg-emerald-500/90 text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                        จบแล้ว
                      </div>
                    )}

                    {movie.poster_url ? (
                      <Image
                        src={movie.poster_url}
                        alt={movie.title}
                        fill sizes="(max-width: 640px) 45vw, 15vw"
                        className="object-cover group-hover:scale-105 transition duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-700 text-xs">ไม่มีรูป</div>
                    )}

                    <div className="absolute bottom-2 left-2 z-10 bg-black/70 backdrop-blur-sm text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                      {epCounts[movie.id] || 0} ตอน
                    </div>
                  </div>

                  <div className="mt-2.5 px-0.5 space-y-0.5">
                    <h4 className="text-xs sm:text-sm font-bold text-zinc-200 group-hover:text-amber-400 transition truncate">
                      {movie.title}
                    </h4>
                    <p className="text-[10px] text-zinc-500 truncate">
                      {movie.genre || 'ครอบครัว'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 4: ละคร AI ย้อนยุค */}
        {periodMovies.length > 0 && (
          <section className="space-y-4 pt-4 border-t border-white/[0.06]">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <span className="sec-bar" aria-hidden="true" /> ละคร AI ย้อนยุค
              </h3>
              <Link href="/movies?genre=ย้อนยุค" className="text-xs text-zinc-400 hover:text-amber-400 transition">
                ดูทั้งหมด {periodMovies.length} เรื่อง &gt;
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {periodMovies.slice(0, 7).map((movie) => (
                <Link key={movie.id} href={`/title/${encodeURIComponent(movie.title)}`} className="group flex flex-col">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#18181b] border border-white/[0.07] group-hover:border-amber-500/40 group-hover:-translate-y-1 transition duration-300 shadow-xl">

                    {movie.is_completed && (
                      <div className="absolute top-2 right-2 z-10 bg-emerald-500/90 text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                        จบแล้ว
                      </div>
                    )}

                    {movie.poster_url ? (
                      <Image
                        src={movie.poster_url}
                        alt={movie.title}
                        fill sizes="(max-width: 640px) 45vw, 15vw"
                        className="object-cover group-hover:scale-105 transition duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-700 text-xs">ไม่มีรูป</div>
                    )}

                    <div className="absolute bottom-2 left-2 z-10 bg-black/70 backdrop-blur-sm text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                      {epCounts[movie.id] || 0} ตอน
                    </div>
                  </div>

                  <div className="mt-2.5 px-0.5 space-y-0.5">
                    <h4 className="text-xs sm:text-sm font-bold text-zinc-200 group-hover:text-amber-400 transition truncate">
                      {movie.title}
                    </h4>
                    <p className="text-[10px] text-zinc-500 truncate">
                      {movie.genre || 'ย้อนยุค'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 5: ละคร AI แนวแก้แค้น */}
        {revengeMovies.length > 0 && (
          <section className="space-y-4 pt-4 border-t border-white/[0.06]">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <span className="sec-bar" aria-hidden="true" /> ละคร AI แนวแก้แค้น
              </h3>
              <Link href="/movies?genre=แก้แค้น" className="text-xs text-zinc-400 hover:text-amber-400 transition">
                ดูทั้งหมด {revengeMovies.length} เรื่อง &gt;
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {revengeMovies.slice(0, 7).map((movie) => (
                <Link key={movie.id} href={`/title/${encodeURIComponent(movie.title)}`} className="group flex flex-col">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#18181b] border border-white/[0.07] group-hover:border-amber-500/40 group-hover:-translate-y-1 transition duration-300 shadow-xl">

                    {movie.is_completed && (
                      <div className="absolute top-2 right-2 z-10 bg-emerald-500/90 text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                        จบแล้ว
                      </div>
                    )}

                    {movie.poster_url ? (
                      <Image
                        src={movie.poster_url}
                        alt={movie.title}
                        fill sizes="(max-width: 640px) 45vw, 15vw"
                        className="object-cover group-hover:scale-105 transition duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-700 text-xs">ไม่มีรูป</div>
                    )}

                    <div className="absolute bottom-2 left-2 z-10 bg-black/70 backdrop-blur-sm text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                      {epCounts[movie.id] || 0} ตอน
                    </div>
                  </div>

                  <div className="mt-2.5 px-0.5 space-y-0.5">
                    <h4 className="text-xs sm:text-sm font-bold text-zinc-200 group-hover:text-amber-400 transition truncate">
                      {movie.title}
                    </h4>
                    <p className="text-[10px] text-zinc-500 truncate">
                      {movie.genre || 'แก้แค้น'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 6: จบแล้ว ดูรวดเดียว */}
        {completedMovies.length > 0 && (
          <section className="space-y-4 pt-4 border-t border-white/[0.06]">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <span className="sec-bar" aria-hidden="true" /> จบแล้ว ดูรวดเดียว
              </h3>
              <Link href="/movies?status=completed" className="text-xs text-zinc-400 hover:text-amber-400 transition">
                ดูทั้งหมด {completedMovies.length} เรื่อง &gt;
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {completedMovies.slice(0, 7).map((movie) => (
                <Link key={movie.id} href={`/title/${encodeURIComponent(movie.title)}`} className="group flex flex-col">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#18181b] border border-white/[0.07] group-hover:border-amber-500/40 group-hover:-translate-y-1 transition duration-300 shadow-xl">

                    <div className="absolute top-2 right-2 z-10 bg-emerald-500/90 text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                      จบแล้ว
                    </div>

                    {movie.poster_url ? (
                      <Image
                        src={movie.poster_url}
                        alt={movie.title}
                        fill sizes="(max-width: 640px) 45vw, 15vw"
                        className="object-cover group-hover:scale-105 transition duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-700 text-xs">ไม่มีรูป</div>
                    )}

                    <div className="absolute bottom-2 left-2 z-10 bg-black/70 backdrop-blur-sm text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                      {epCounts[movie.id] || 0} ตอน
                    </div>
                  </div>

                  <div className="mt-2.5 px-0.5 space-y-0.5">
                    <h4 className="text-xs sm:text-sm font-bold text-zinc-200 group-hover:text-amber-400 transition truncate">
                      {movie.title}
                    </h4>
                    <p className="text-[10px] text-zinc-500 truncate">
                      {movie.genre || 'จบแล้ว'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 7: เลือกตามแนว (Genre Card Grid) */}
        <section className="space-y-4 pt-6 border-t border-white/[0.06]">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <span className="sec-bar" aria-hidden="true" /> เลือกตามแนว
            </h3>
            <Link href="/movies" className="text-xs text-zinc-400 hover:text-amber-400 transition">
              ทั้งหมด &gt;
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {ALL_GENRES.map((genre) => {
              const genreMovieCount = movies.filter(m => m.genre?.includes(genre)).length
              return (
                <Link
                  key={genre}
                  href={`/movies?genre=${encodeURIComponent(genre)}`}
                  className="bg-[#121214] hover:bg-[#18181b] border border-white/[0.07] hover:border-amber-500/40 rounded-2xl p-4 transition duration-200 flex flex-col justify-between group shadow-lg"
                >
                  <span className="text-xs sm:text-sm font-bold text-zinc-200 group-hover:text-amber-400 transition">
                    {genre}
                  </span>
                  <span className="text-[11px] font-semibold text-zinc-500 mt-2">
                    {genreMovieCount} เรื่อง
                  </span>
                </Link>
              )
            })}
          </div>
        </section>

        {/* SECTION 8: ละครทั้งหมด (All Movies Grid) */}
        <section className="space-y-4 pt-6 border-t border-white/[0.06]">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <span className="sec-bar" aria-hidden="true" /> ละครทั้งหมด {movies.length} เรื่อง
            </h3>
            <span className="text-xs text-zinc-500 font-medium">
              เลือกตามแนว / เรียงลำดับ &gt;
            </span>
          </div>

          {loading ? (
            <div className="text-center py-20 text-zinc-500 text-xs animate-pulse">กำลังโหลดข้อมูล...</div>
          ) : movies.length === 0 ? (
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-500 text-xs">
              ยังไม่มีข้อมูลซีรีส์ในระบบ Supabase
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {movies.map((movie) => (
                <Link key={movie.id} href={`/title/${encodeURIComponent(movie.title)}`} className="group flex flex-col">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#18181b] border border-white/[0.07] group-hover:border-amber-500/40 group-hover:-translate-y-1 transition duration-300 shadow-xl">

                    {movie.is_completed && (
                      <div className="absolute top-2 right-2 z-10 bg-emerald-500/90 text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                        จบแล้ว
                      </div>
                    )}

                    {movie.poster_url ? (
                      <Image
                        src={movie.poster_url}
                        alt={movie.title}
                        fill sizes="(max-width: 640px) 45vw, 15vw"
                        className="object-cover group-hover:scale-105 transition duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-700 text-xs">ไม่มีรูป</div>
                    )}

                    <div className="absolute bottom-2 left-2 z-10 bg-black/70 backdrop-blur-sm text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                      {epCounts[movie.id] || 0} ตอน
                    </div>
                  </div>

                  <div className="mt-2.5 px-0.5 space-y-0.5">
                    <h4 className="text-xs sm:text-sm font-bold text-zinc-200 group-hover:text-amber-400 transition truncate">
                      {movie.title}
                    </h4>
                    <p className="text-[10px] text-zinc-500 truncate">
                      {movie.genre || 'ซีรีส์สั้น AI'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

      </main>

      {/* Footer Component */}
      <Footer />
    </div>
  )
}