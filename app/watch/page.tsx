import type { Metadata } from 'next'
import { Suspense } from 'react'
import { connection } from 'next/server'
import WatchRoute from './WatchRoute'
import { getSupabaseServerClient } from '@/lib/supabase-server'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

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

/**
 * DynamicMarker — เหตุผลเดียวกับ app/movie-detail/page.tsx
 * (metadata per-request จาก searchParams + Supabase)
 */
async function DynamicMarker() {
    await connection()
    return null
}

export default function WatchPage() {
    return (
        <>
            <Suspense fallback={null}>
                <DynamicMarker />
            </Suspense>
            <Suspense
                fallback={
                    <div className="min-h-screen bg-[#0b0b0d] text-white flex items-center justify-center text-xs">
                        กำลังโหลดหน้าวิดีโอ...
                    </div>
                }
            >
                <WatchRoute />
            </Suspense>
        </>
    )
}
