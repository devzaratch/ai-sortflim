import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import MovieDetailContent from '@/app/movie-detail/MovieDetailContent'
import { getMovieByTitle, resolveTitle } from './lookup'

/**
 * หน้ารายละเอียดแบบ URL slug: /title/<ชื่อเรื่อง>
 * เช่น /title/ปรารถนาอัลฟ่าต้องห้าม
 * (เดิมใช้ /movie-detail?movieId=<uuid> — ยังใช้งานได้อยู่แต่ canonical คือหน้านี้)
 */

interface TitlePageProps {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: TitlePageProps): Promise<Metadata> {
    'use cache'
    const { slug } = await params
    const movie = await getMovieByTitle(resolveTitle(slug))

    if (!movie) {
        return {
            title: 'รายละเอียดละคร AI',
            description: 'ข้อมูลละครสั้น AI และรายชื่อตอนครบทุกตอน',
        }
    }

    const description =
        movie.description?.slice(0, 160) ??
        `ดู${movie.title} ละครสั้น AI แนวตั้ง พร้อมรายชื่อตอนครบทุกตอน`

    const canonical = `/title/${encodeURIComponent(movie.title)}`

    return {
        title: `${movie.title} (ดูครบทุกตอน${movie.is_completed ? ' จบแล้ว' : ''})`,
        description,
        alternates: { canonical },
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

/** เนื้อหาหน้า — ต้องอยู่ใน <Suspense> เพราะอ่าน params ตอน request (Cache Components) */
async function TitleContent({ slug }: { slug: string }) {
    const movie = await getMovieByTitle(resolveTitle(slug))

    if (!movie) notFound()

    return <MovieDetailContent movieId={movie.id} />
}

export default function TitlePage({ params }: TitlePageProps) {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-[#0b0b0d] text-white flex items-center justify-center text-xs">
                    กำลังโหลดหน้า...
                </div>
            }
        >
            <TitlePageContent params={params} />
        </Suspense>
    )
}

async function TitlePageContent({ params }: TitlePageProps) {
    const { slug } = await params
    return <TitleContent slug={slug} />
}
