'use client'

import { useSearchParams } from 'next/navigation'
import MovieDetailContent from './MovieDetailContent'

/**
 * อ่าน movieId จาก URL ฝั่ง client (แบบเดียวกับ app/movies/page.tsx)
 * เดิมใช้ async server component + await searchParams ข้างใน <Suspense>
 * แต่ใน Next.js 16 (Cache Components) pattern นั้นทำให้ boundary ค้างที่ fallback
 * ตอนเปิดตรง URL ใน dev เพราะ content ที่ resume กลับมาไม่ถูก commit
 */
export default function MovieDetailRoute() {
    const searchParams = useSearchParams()
    const movieId = searchParams.get('movieId')

    return <MovieDetailContent movieId={movieId} />
}
