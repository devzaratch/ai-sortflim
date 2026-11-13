'use client'

import { useSearchParams } from 'next/navigation'
import WatchContent from '@/app/watch/WatchContent'

/**
 * หน้าดูตอนแบบ slug (/title/<ชื่อเรื่อง>/watch)
 * movieId มาจาก server (resolve จากชื่อเรื่องแล้ว) ส่วนเลขตอนอ่านจาก ?ep= ฝั่ง client
 */
export default function WatchSlugRoute({ movieId }: { movieId: string }) {
    const searchParams = useSearchParams()
    const epParam = searchParams.get('ep')
    const parsedEp = epParam ? Number.parseInt(epParam, 10) : NaN

    return (
        <WatchContent
            movieId={movieId}
            initialEp={Number.isFinite(parsedEp) && parsedEp > 0 ? parsedEp : null}
        />
    )
}
