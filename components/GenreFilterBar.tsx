'use client'

import { useRouter } from 'next/navigation'
import { Pin } from 'lucide-react'

/**
 * แถบกรองหมวดหมู่ + ตัวเลือกเรียงลำดับ — ปรับค่าผ่าน URL เพื่อให้แชร์ลิงก์ได้
 * (Server Component หน้า /movies อ่านค่าจาก searchParams แล้ว render ให้)
 */
const GENRES = [
    'ทุกแนว', 'ดราม่า', 'โรแมนติก', 'ครอบครัว', 'แก้แค้น',
    'ย้อนยุค', 'แฟนตาซี', 'วาย', 'คุณธรรม', 'ผี',
    'คอมเมดี้', 'ท่านประธาน', 'รักวัยเรียน', 'แอ็คชั่น', 'พลิกชีวิต',
    'ตามหายาก', 'ประวัติศาสตร์', 'รักขมขื่น', 'เกิดใหม่', 'เทพเซียน',
    'ข้ามกาลเวลา', 'ทะลุมิติ'
]

export default function GenreFilterBar({
    genreCounts,
    selectedGenre,
    completedOnly,
    sortBy,
    search,
}: {
    genreCounts: Record<string, number>
    selectedGenre: string
    completedOnly: boolean
    sortBy: string
    search: string
}) {
    const router = useRouter()

    /** ประกอบ URL โดยคงค่าอื่นที่กำลังกรองอยู่ */
    const buildUrl = (patch: { genre?: string; status?: string | null; sort?: string }) => {
        const params = new URLSearchParams()
        if (search) params.set('search', search)
        if (patch.genre !== undefined) {
            if (patch.genre && patch.genre !== 'ทุกแนว') params.set('genre', patch.genre)
        } else if (selectedGenre !== 'ทุกแนว') {
            params.set('genre', selectedGenre)
        }
        const nextStatus = patch.status !== undefined ? patch.status : (completedOnly ? 'completed' : null)
        if (nextStatus) params.set('status', nextStatus)
        const nextSort = patch.sort !== undefined ? patch.sort : sortBy
        if (nextSort && nextSort !== 'latest') params.set('sort', nextSort)
        const qs = params.toString()
        return qs ? `/movies?${qs}` : '/movies'
    }

    return (
        <div className="space-y-4 bg-zinc-900/40 border border-zinc-800/80 p-4 rounded-2xl">
            {/* แถบหมวดหมู่ */}
            <div className="flex flex-wrap items-center gap-2 max-h-48 overflow-y-auto pr-1">
                {GENRES.map((genre) => {
                    const count = genre === 'ทุกแนว' ? 0 : (genreCounts[genre] || 0)
                    return (
                        <button
                            key={genre}
                            onClick={() => router.push(buildUrl({ genre }))}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${selectedGenre === genre
                                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                                : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                                }`}
                        >
                            <span>{genre}</span>
                            {genre !== 'ทุกแนว' && count > 0 && (
                                <span className="text-[10px] opacity-70 bg-black/20 px-1.5 py-0.2 rounded-full">
                                    {count}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* แถบย่อย: ปุ่มติ๊ก "จบแล้วเท่านั้น" และตัวเลือกเรียงลำดับ */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-zinc-800/60 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-zinc-300 select-none">
                    <input
                        type="checkbox"
                        checked={completedOnly}
                        onChange={(e) => router.push(buildUrl({ status: e.target.checked ? 'completed' : null }))}
                        className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                    <span className="flex items-center gap-1.5"><Pin className="w-3.5 h-3.5" aria-hidden="true" /> จบแล้วเท่านั้น</span>
                </label>

                <div className="flex items-center gap-3 text-zinc-400">
                    <select
                        value={sortBy}
                        onChange={(e) => router.push(buildUrl({ sort: e.target.value }))}
                        className="bg-zinc-800 border border-zinc-700 text-zinc-200 px-3 py-1.5 rounded-xl text-xs font-bold focus:outline-none focus:border-amber-500"
                    >
                        <option value="latest">ใหม่ล่าสุด</option>
                        <option value="popular">ยอดนิยม</option>
                    </select>
                </div>
            </div>
        </div>
    )
}
