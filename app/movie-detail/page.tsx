import type { Metadata } from 'next'
import { Suspense } from 'react'
import MovieDetailRoute from './MovieDetailRoute'
import { getSupabaseServerClient } from '@/lib/supabase-server'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

function firstParam(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value
}

async function getMovieSummary(movieId: string | null) {
    if (!movieId) return null

    try {
        const supabase = getSupabaseServerClient()
        const { data } = await supabase
            .from('movies')
            .select('title, description, poster_url')
            .eq('id', movieId)
            .maybeSingle()

        return data
    } catch {
        return null
    }
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
    const movieId = firstParam((await searchParams).movieId) ?? null
    const movie = await getMovieSummary(movieId)

    if (!movie) {
        return {
            title: 'รายละเอียดละคร AI',
            description: 'ข้อมูลละครสั้น AI และรายชื่อตอนครบทุกตอน',
        }
    }

    const description =
        movie.description?.slice(0, 160) ??
        `ดู${movie.title} ละครสั้น AI แนวตั้ง พร้อมรายชื่อตอนครบทุกตอน`

    return {
        title: movie.title,
        description,
        alternates: { canonical: `/movie-detail?movieId=${movieId}` },
        openGraph: {
            title: movie.title,
            description,
            type: 'video.other',
            images: movie.poster_url ? [{ url: movie.poster_url }] : undefined,
        },
        twitter: {
            card: 'summary_large_image',
            title: movie.title,
            description,
        },
    }
}

export default function MovieDetailPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-[#0b0b0d] text-white flex items-center justify-center text-xs">
                    กำลังโหลดหน้า...
                </div>
            }
        >
            <MovieDetailRoute />
        </Suspense>
    )
}
