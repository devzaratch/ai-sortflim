import type { Metadata } from 'next'
import { Suspense } from 'react'
import { connection } from 'next/server'
import WatchContent from './WatchContent'
import { getSupabaseServerClient } from '@/lib/supabase-server'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

/** บอก Next.js ว่า route นี้ตั้งใจ render ตอน request (metadata ใช้ searchParams + DB) */
async function DynamicMarker() {
    await connection()
    return null
}


function firstParam(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
    const movieId = firstParam((await searchParams).movieId) ?? null

    if (!movieId) {
        return { title: 'ดูวิดีโอ', robots: { index: false, follow: false } }
    }

    try {
        const supabase = getSupabaseServerClient()
        const { data } = await supabase
            .from('movies')
            .select('title, description, poster_url')
            .eq('id', movieId)
            .maybeSingle()

        if (!data) {
            return { title: 'ดูวิดีโอ', robots: { index: false, follow: false } }
        }

        const description = data.description?.slice(0, 160) ?? `ดู${data.title} ละครสั้น AI แนวตั้ง`

        return {
            title: `ดู ${data.title}`,
            description,
            alternates: { canonical: `/movie-detail?movieId=${movieId}` },
            openGraph: {
                title: data.title,
                description,
                type: 'video.other',
                images: data.poster_url ? [{ url: data.poster_url }] : undefined,
            },
        }
    } catch {
        return { title: 'ดูวิดีโอ', robots: { index: false, follow: false } }
    }
}

async function WatchRoute({ searchParams }: { searchParams: SearchParams }) {
    const params = await searchParams
    const movieId = firstParam(params.movieId) ?? null
    const epParam = firstParam(params.ep)
    const parsedEp = epParam ? Number.parseInt(epParam, 10) : NaN

    return (
        <WatchContent
            movieId={movieId}
            initialEp={Number.isFinite(parsedEp) && parsedEp > 0 ? parsedEp : null}
        />
    )
}

export default function WatchPage({ searchParams }: { searchParams: SearchParams }) {
    return (
        <>
            <Suspense
                fallback={
                    <div className="min-h-screen bg-[#0b0b0d] text-white flex items-center justify-center text-xs">
                        กำลังโหลดหน้าวิดีโอ...
                    </div>
                }
            >
                <WatchRoute searchParams={searchParams} />
            </Suspense>
            <Suspense>
                <DynamicMarker />
            </Suspense>
        </>
    )
}
