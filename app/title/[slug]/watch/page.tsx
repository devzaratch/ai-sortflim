import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import WatchSlugRoute from './WatchSlugRoute'
import { getMovieByTitle, resolveTitle } from '../lookup'

/**
 * หน้าดูตอนแบบ URL slug: /title/<ชื่อเรื่อง>/watch?ep=<เลขตอน>
 * (เดิมใช้ /watch?movieId=<uuid> — ยังใช้งานได้อยู่แต่ canonical คือหน้านี้)
 * metadata ใช้ params + 'use cache' แบบ static จึงไม่ต้องมี DynamicMarker
 */

interface WatchPageProps {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: WatchPageProps): Promise<Metadata> {
    'use cache'
    const { slug } = await params
    const movie = await getMovieByTitle(resolveTitle(slug))

    if (!movie) {
        return { title: 'ดูวิดีโอ', robots: { index: false, follow: false } }
    }

    const description = movie.description?.slice(0, 160) ?? `ดู${movie.title} ละครสั้น AI แนวตั้ง`

    return {
        title: `ดู ${movie.title}`,
        description,
        robots: { index: false, follow: true },
        alternates: { canonical: `/title/${encodeURIComponent(movie.title)}` },
        openGraph: {
            title: movie.title,
            description,
            type: 'video.other',
            images: movie.poster_url ? [{ url: movie.poster_url }] : undefined,
        },
    }
}

/** เนื้อหาหน้า — resolve ชื่อเรื่องจาก slug แล้วส่ง movieId ให้ player */
async function WatchPageContent({ slug }: { slug: string }) {
    const movie = await getMovieByTitle(resolveTitle(slug))

    if (!movie) notFound()

    return <WatchSlugRoute movieId={movie.id} />
}

export default function TitleWatchPage({ params }: WatchPageProps) {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-[#0b0b0d] text-white flex items-center justify-center text-xs">
                    กำลังโหลดหน้าวิดีโอ...
                </div>
            }
        >
            <WatchPageLoader params={params} />
        </Suspense>
    )
}

async function WatchPageLoader({ params }: WatchPageProps) {
    const { slug } = await params
    return <WatchPageContent slug={slug} />
}
