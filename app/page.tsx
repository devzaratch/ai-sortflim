import Footer from '@/components/Footer'
import Header from '@/components/Header'
import MovieGrid from '@/components/MovieGrid'
import Image from 'next/image'
import HeroCarousel from '@/components/home/HeroCarousel'
import ContinueWatching from '@/components/home/ContinueWatching'
import Recommendations from '@/components/home/Recommendations'
import HomeSection from '@/components/home/HomeSection'
import UpdateDate from '@/components/home/UpdateDate'
import { getEpisodeCounts, getHeroMovies, getMoviesLight, getViewCounts } from '@/lib/data-server'
import { formatViews } from '@/lib/views'

/**
 * หน้าแรก — Server Component (Wave 3 ข้อ 5)
 * - เนื้อหาหลัก (Hero/Top10/แนวต่าง ๆ/เลือกตามแนว/ทั้งหมด) ฝั่ง server + use cache → Google เห็นครบ โหลดเร็ว
 * - เฉพาะ 3 ชิ้นที่ต้องใช้ browser ยังเป็น client: HeroCarousel (สไลด์อัตโนมัติ), ดูต่อ (localStorage/user), แนะนำสำหรับคุณ (อิงประวัติ)
 */

// รายชื่อหมวดหมู่ทั้งหมดสำหรับสร้าง Genre Cards
const ALL_GENRES = [
    'รักวัยเรียน', 'โรแมนติก', 'ครอบครัว', 'แก้แค้น', 'ดราม่า', 'ย้อนยุค',
    'คุณธรรม', 'คอมเมดี้', 'แอ็คชั่น', 'วาย', 'ท่านประธาน', 'ผี',
    'พลิกชีวิต', 'แฟนตาซี'
]

export default async function Home() {
    const [movies, epCounts, viewCounts, heroMovies] = await Promise.all([
        getMoviesLight(),
        getEpisodeCounts(),
        getViewCounts(),
        getHeroMovies(5),
    ])

    const totalEpisodesCount = Object.values(epCounts).reduce((sum, n) => sum + n, 0)

    // Top 10 เรียงตามยอดวิวจริงจากตาราง view_counts — ถ้ายังไม่มีข้อมูลวิว แสดงเรื่องล่าสุดแทน
    const top10Movies =
        Object.keys(viewCounts).length === 0
            ? movies.slice(0, 10)
            : [...movies]
                .sort((a, b) => (viewCounts[b.id] || 0) - (viewCounts[a.id] || 0))
                .slice(0, 10)

    // กรองซีรีส์ตามหมวดหมู่จากข้อมูลจริงใน Supabase
    const genreSections: Array<{ title: string; genre: string; href: string; movies: typeof movies }> = [
        { title: 'ละคร AI แนวดราม่า', genre: 'ดราม่า', href: '/movies?genre=ดราม่า', movies: movies.filter(m => m.genre?.includes('ดราม่า')) },
        { title: 'ละคร AI โรแมนติก', genre: 'โรแมนติก', href: '/movies?genre=โรแมนติก', movies: movies.filter(m => m.genre?.includes('โรแมนติก')) },
        { title: 'ละคร AI แนวครอบครัว', genre: 'ครอบครัว', href: '/movies?genre=ครอบครัว', movies: movies.filter(m => m.genre?.includes('ครอบครัว')) },
        { title: 'ละคร AI ย้อนยุค', genre: 'ย้อนยุค', href: '/movies?genre=ย้อนยุค', movies: movies.filter(m => m.genre?.includes('ย้อนยุค')) },
        { title: 'ละคร AI แนวแก้แค้น', genre: 'แก้แค้น', href: '/movies?genre=แก้แค้น', movies: movies.filter(m => m.genre?.includes('แก้แค้น')) },
    ]
    const completedMovies = movies.filter(m => m.is_completed === true)

    return (
        <div className="min-h-screen bg-[#0a0a0b] text-white font-sans selection:bg-amber-500 selection:text-[#1c1917]">

            <Header isHome />

            <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-10">

                {/* Featured Hero Carousel (client — สไลด์อัตโนมัติ) */}
                <HeroCarousel heroMovies={heroMovies} epCounts={epCounts} />

                {/* SEO Info Headline */}
                <div className="space-y-1">
                    <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                        ดูละคร AI ละครสั้น AI ซีรีส์ AI แนวตั้ง ครบทุกตอน
                    </h2>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                        รวมละคร AI พากย์ไทย ทั้งหมด {movies.length} เรื่อง {totalEpisodesCount} ตอน ทั้งวาย ย้อนยุค โรแมนติก แฟนตาซี จัดเรียงตอนตั้งแต่ EP.1 ดูฟรี ไม่ต้องสมัครสมาชิก <UpdateDate />
                    </p>
                </div>

                {/* ดูต่อจากที่ค้างไว้ (client — localStorage/user) */}
                <ContinueWatching />

                {/* แนะนำสำหรับคุณ (client — อิงประวัติการดู) */}
                <Recommendations epCounts={epCounts} />

                {/* SECTION: อัปเดตล่าสุด */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                        <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                            <span className="sec-bar" aria-hidden="true" /> อัปเดตล่าสุด
                        </h3>
                        <a href="/movies" className="text-xs text-zinc-400 hover:text-amber-400 transition">
                            ดูทั้งหมด {movies.length} เรื่อง &gt;
                        </a>
                    </div>

                    {movies.length === 0 ? (
                        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-500 text-xs">
                            ยังไม่มีข้อมูลซีรีส์ในระบบ Supabase
                        </div>
                    ) : (
                        <MovieGrid movies={movies.slice(0, 6)} epCounts={epCounts} priorityCount={0} />
                    )}
                </section>

                {/* SECTION: ยอดนิยม Top 10 (เรียงตามยอดวิวจริง) */}
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
                                    <a key={movie.id} href={`/title/${encodeURIComponent(movie.title)}`} className="group flex flex-col relative active:scale-95 transition-transform">
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
                                    </a>
                                )
                            })}
                        </div>
                    </section>
                )}

                {/* SECTION 1-5: แนวยอดนิยม */}
                {genreSections.map((section) => (
                    <HomeSection
                        key={section.genre}
                        title={section.title}
                        moreHref={section.href}
                        moreLabel={`ดูทั้งหมด ${section.movies.length} เรื่อง`}
                        movies={section.movies}
                        epCounts={epCounts}
                    />
                ))}

                {/* SECTION 6: จบแล้ว ดูรวดเดียว */}
                <HomeSection
                    title="จบแล้ว ดูรวดเดียว"
                    moreHref="/movies?status=completed"
                    moreLabel={`ดูทั้งหมด ${completedMovies.length} เรื่อง`}
                    movies={completedMovies}
                    epCounts={epCounts}
                />

                {/* SECTION 7: เลือกตามแนว (Genre Card Grid) */}
                <section className="space-y-4 pt-6 border-t border-white/[0.06]">
                    <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                        <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                            <span className="sec-bar" aria-hidden="true" /> เลือกตามแนว
                        </h3>
                        <a href="/movies" className="text-xs text-zinc-400 hover:text-amber-400 transition">
                            ทั้งหมด &gt;
                        </a>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {ALL_GENRES.map((genre) => {
                            const genreMovieCount = movies.filter(m => m.genre?.includes(genre)).length
                            return (
                                <a
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
                                </a>
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

                    {movies.length === 0 ? (
                        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-500 text-xs">
                            ยังไม่มีข้อมูลซีรีส์ในระบบ Supabase
                        </div>
                    ) : (
                        <MovieGrid movies={movies} epCounts={epCounts} priorityCount={0} />
                    )}
                </section>

            </main>

            {/* Footer Component */}
            <Footer />
        </div>
    )
}
