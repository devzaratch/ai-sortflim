import Image from 'next/image'
import Link from 'next/link'
import type { Movie } from '@/lib/types'

/**
 * แถว section หน้าแรก (server-compatible) — ใช้ร่วมกันทุกแนว: ดราม่า/โรแมนติก/... จบแล้ว/อัปเดตล่าสุด
 * แสดงการ์ดไม่เกิน `limit` เรื่อง + ลิงก์ "ดูทั้งหมด" ไปหน้า /movies พร้อมตัวกรอง
 */
export default function HomeSection({
    title,
    moreHref,
    moreLabel,
    movies,
    epCounts,
    limit = 7,
}: {
    title: string
    moreHref?: string
    moreLabel?: string
    movies: Movie[]
    epCounts: Record<string, number>
    limit?: number
}) {
    if (movies.length === 0) return null

    return (
        <section className="space-y-4 pt-4 border-t border-white/[0.06]">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <span className="sec-bar" aria-hidden="true" /> {title}
                </h3>
                {moreHref && (
                    <Link href={moreHref} className="text-xs text-zinc-400 hover:text-amber-400 transition">
                        {moreLabel || 'ดูทั้งหมด'} &gt;
                    </Link>
                )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {movies.slice(0, limit).map((movie) => (
                    <Link key={movie.id} href={`/title/${encodeURIComponent(movie.title)}`} className="group flex flex-col active:scale-95 transition-transform">
                        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#18181b] border border-white/[0.07] group-hover:border-amber-500/40 group-hover:-translate-y-1 transition duration-300 shadow-xl">

                            {movie.is_completed && (
                                <div className="absolute top-2 right-2 z-10 bg-emerald-500/90 text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                                    จบแล้ว
                                </div>
                            )}

                            {movie.poster_url ? (
                                <Image
                                    src={movie.poster_url}
                                    alt={movie.title}
                                    fill sizes="(max-width: 640px) 45vw, 15vw"
                                    className="object-cover group-hover:scale-105 transition duration-500"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-700 text-xs">ไม่มีรูป</div>
                            )}

                            <div className="absolute bottom-2 left-2 z-10 bg-black/70 backdrop-blur-sm text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                                {epCounts[movie.id] || 0} ตอน
                            </div>
                        </div>

                        <div className="mt-2.5 px-0.5 space-y-0.5">
                            <h4 className="text-xs sm:text-sm font-bold text-zinc-200 group-hover:text-amber-400 transition truncate">
                                {movie.title}
                            </h4>
                            <p className="text-[10px] text-zinc-500 truncate">
                                {movie.genre || 'ซีรีส์สั้น AI'}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    )
}
