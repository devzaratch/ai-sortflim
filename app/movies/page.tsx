import { Suspense } from 'react'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import GenreFilterBar from '@/components/GenreFilterBar'
import MovieGrid from '@/components/MovieGrid'
import Pagination from '@/components/Pagination'
import SavedMovies from '@/components/SavedMovies'
import { computeGenreCounts, getEpisodeCounts, getMoviesLight } from '@/lib/data-server'

/**
 * หน้ารายการละคร — Server Component (Wave 3 ข้อ 5)
 * - กรอง/ค้นหา/เรียง/แบ่งหน้าทำทั้งหมดบน server → Google เห็นเนื้อหาครบ + โหลดเร็ว
 * - ตัวกรองอยู่ใน URL (genre, status, search, sort, page) แชร์ลิงก์ได้
 * - โหมดเรื่องที่เก็บไว้ (saved=1) อ่าน localStorage ได้เฉพาะฝั่ง client → ยกให้ SavedMovies
 */

const PAGE_SIZE = 24

interface RawSearchParams {
    [key: string]: string | string[] | undefined
}

function first(value: string | string[] | undefined): string | undefined {
    return Array.isArray(value) ? value[0] : value
}

interface Filters {
    genre: string
    completedOnly: boolean
    search: string
    sort: 'latest' | 'popular'
    page: number
}

function parseFilters(sp: RawSearchParams): Filters {
    const sortRaw = first(sp.sort)
    const pageRaw = first(sp.page)
    const parsedPage = parseInt(pageRaw || '1', 10)
    return {
        genre: first(sp.genre) || 'ทุกแนว',
        completedOnly: first(sp.status) === 'completed',
        search: (first(sp.search) || '').trim(),
        sort: sortRaw === 'popular' ? 'popular' : 'latest',
        page: Math.max(1, Number.isNaN(parsedPage) ? 1 : parsedPage),
    }
}

function buildHref(filters: Filters, page: number): string {
    const params = new URLSearchParams()
    if (filters.search) params.set('search', filters.search)
    if (filters.genre !== 'ทุกแนว') params.set('genre', filters.genre)
    if (filters.completedOnly) params.set('status', 'completed')
    if (filters.sort !== 'latest') params.set('sort', filters.sort)
    if (page > 1) params.set('page', String(page))
    const qs = params.toString()
    return qs ? `/movies?${qs}` : '/movies'
}

/** เนื้อหาลิสต์ — ค้นและแบ่งหน้าบน server (ข้อมูลมาจาก cache) */
async function MoviesList({ filters }: { filters: Filters }) {
    const [allMovies, epCounts] = await Promise.all([getMoviesLight(), getEpisodeCounts()])

    // กรองตามหมวด/สถานะ/คำค้นหา (เหมือน logic เดิม แต่ทำบน server)
    const searchTerm = filters.search.toLowerCase()
    const filtered = allMovies.filter((movie) => {
        const movieGenres = movie.genre ? movie.genre.split(',').map((t) => t.trim()) : []
        const matchGenre = filters.genre === 'ทุกแนว' || movieGenres.includes(filters.genre)
        const matchCompleted = filters.completedOnly ? movie.is_completed === true : true
        const matchSearch =
            !searchTerm ||
            (movie.title || '').toLowerCase().includes(searchTerm) ||
            (movie.genre || '').toLowerCase().includes(searchTerm)
        return matchGenre && matchCompleted && matchSearch
    })

    // เรียงลำดับ
    const sorted = [...filtered].sort((a, b) => {
        if (filters.sort === 'popular') {
            return (epCounts[b.id] || 0) - (epCounts[a.id] || 0)
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    // แบ่งหน้า 24 เรื่อง
    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
    const page = Math.min(filters.page, totalPages)
    const pageMovies = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    const displayedTotalEps = pageMovies.reduce((acc, m) => acc + (epCounts[m.id] || 0), 0)

    if (pageMovies.length === 0) {
        return (
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-500 text-xs space-y-3">
                <p>ไม่พบละครในหมวดหมู่ที่คุณเลือก</p>
                <a href="/movies" className="inline-block text-amber-400 hover:underline font-bold">
                    ดูละครทั้งหมด
                </a>
            </div>
        )
    }

    return (
        <>
            <MovieGrid movies={pageMovies} epCounts={epCounts} priorityCount={2} />
            <p className="text-center text-[10px] text-zinc-600 pt-2">
                หน้า {page} / {totalPages} • {pageMovies.length} เรื่อง {displayedTotalEps} ตอนในหน้านี้
            </p>
            <Pagination page={page} totalPages={totalPages} buildHref={(n) => buildHref(filters, n)} />
        </>
    )
}

export default function MoviesPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
    return (
        <div className="min-h-screen bg-[#0b0b0d] text-white font-sans selection:bg-amber-500 selection:text-black flex flex-col justify-between">
            <div>
                <Header activeStatus={null} />

                <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
                    <Suspense
                        fallback={
                            <div className="bg-zinc-900/40 border border-zinc-800/80 p-4 rounded-2xl text-center text-zinc-500 text-xs animate-pulse">
                                กำลังโหลดตัวกรอง...
                            </div>
                        }
                    >
                        <MoviesFilter searchParams={searchParams} />
                    </Suspense>
                </main>
            </div>

            <Footer />
        </div>
    )
}

/** อ่าน searchParams แล้ววาดทั้งแถบกรองและลิสต์ (ต้องอยู่ใน Suspense เพราะ dynamic) */
async function MoviesFilter({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
    const sp = await searchParams

    // โหมดเรื่องที่เก็บไว้ — อ่าน localStorage ได้เฉพาะฝั่ง client
    if (first(sp.saved) === '1') {
        return <SavedMovies />
    }

    const filters = parseFilters(sp)

    // จำนวนเรื่องต่อแนว (จากข้อมูลแคช เบามาก)
    const allMovies = await getMoviesLight()
    const genreCounts = computeGenreCounts(allMovies)

    const heading = filters.search
        ? `ผลการค้นหา: ${filters.search}`
        : filters.genre === 'ทุกแนว'
            ? 'ละคร AI ทั้งหมด'
            : `ละคร AI แนว${filters.genre}`

    return (
        <>
            {(filters.search) && (
                <div className="flex flex-wrap items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-4 py-2.5 rounded-xl text-xs font-bold">
                    <span>ผลการค้นหา &ldquo;{filters.search}&rdquo;</span>
                    <a href="/movies" className="ml-auto text-zinc-400 hover:text-white transition font-bold flex items-center gap-1">
                        ล้างตัวกรอง
                    </a>
                </div>
            )}

            <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    {heading}
                </h1>
                <p className="text-xs text-zinc-400">
                    คัดสรรความสนุก พากย์ไทย จัดเรียงตอนตั้งแต่ EP.1
                </p>
            </div>

            <GenreFilterBar
                genreCounts={genreCounts}
                selectedGenre={filters.genre}
                completedOnly={filters.completedOnly}
                sortBy={filters.sort}
                search={filters.search}
            />

            <section>
                <Suspense
                    fallback={
                        <div className="text-center py-20 text-zinc-500 text-xs animate-pulse">กำลังโหลดคลังละคร...</div>
                    }
                >
                    <MoviesList filters={filters} />
                </Suspense>
            </section>
        </>
    )
}
