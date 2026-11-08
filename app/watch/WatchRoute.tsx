'use client'

import { useSearchParams } from 'next/navigation'
import WatchContent from './WatchContent'

/**
 * อ่าน movieId / ep จาก URL ฝั่ง client (แบบเดียวกับ app/movies/page.tsx)
 * เดิมใช้ async server component + await searchParams ข้างใน <Suspense>
 * ซึ่งใน Next.js 16 (Cache Components) ทำให้หน้าค้างที่ fallback ใน dev
 */
export default function WatchRoute() {
    const searchParams = useSearchParams()
    const movieId = searchParams.get('movieId')
    const epParam = searchParams.get('ep')
    const parsedEp = epParam ? Number.parseInt(epParam, 10) : NaN

    return (
        <WatchContent
            movieId={movieId}
            initialEp={Number.isFinite(parsedEp) && parsedEp > 0 ? parsedEp : null}
        />
    )
}
