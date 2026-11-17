import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { getMovieTitleById } from '@/lib/data-server'

/**
 * Route เก่า /watch?movieId=<uuid>&ep=<เลข> — Wave 3 ข้อ 5
 * เลิกใช้แล้ว: redirect (308) ไปหน้า canonical /title/<ชื่อเรื่อง>/watch?ep=<เลข>
 * ประโยชน์: ลดเนื้อหาซ้ำ + เก็บลิงก์เก่า (เช่นจากคำอธิบายวิดีโอ) ให้ยังใช้งานได้
 *
 * หมายเหตุ: เปิด Cache Components อยู่ → route request-time ตอบ 200 พร้อม streamed redirect
 * (เบราว์เซอร์/crawler ที่รัน JS ตามไปเอง) — metadata noindex คงไว้กันถูก index ตามเดิม
 */

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

/** เป็น route redirect เท่านั้น — ให้ render แบบ blocking ได้ (ไม่ต้องมี instant shell) */
export const instant = false

/** ห้าม index (เหมือนเดิมก่อน refactor) — canonical อยู่ที่ /title/<ชื่อ>/watch */
export const metadata: Metadata = {
    title: 'ดูวิดีโอ',
    robots: { index: false, follow: false },
}

function firstParam(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value
}

export default async function WatchPage({ searchParams }: { searchParams: SearchParams }) {
    const sp = await searchParams
    const movieId = firstParam(sp.movieId)

    if (!movieId) notFound()

    const title = await getMovieTitleById(movieId)
    if (!title) notFound()

    // รองรับชื่อพารามิเตอร์เก่าทั้ง ep และ episode
    const epRaw = firstParam(sp.ep) ?? firstParam(sp.episode)
    const ep = epRaw ? Number.parseInt(epRaw, 10) : NaN
    const epParam = Number.isFinite(ep) && ep > 0 ? `?ep=${ep}` : ''

    permanentRedirect(`/title/${encodeURIComponent(title)}/watch${epParam}`)
}
