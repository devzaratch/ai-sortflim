import Image from 'next/image'
import Link from 'next/link'
import type { Movie } from '@/lib/types'

/**
 * ตารางการ์ดละคร — ใช้ได้ทั้งฝั่ง Server (ไม่ต้องมี 'use client')
 * ใช้ร่วมกันระหว่างหน้า /movies (server) และโหมดเรื่องที่เก็บไว้ (client)
 */
export default function MovieGrid({
    movies,
    epCounts,
    priorityCount = 2,
}: {
    movies: Movie[]
    epCounts: Record<string, number>
    /** จำนวนการ์ดแรกที่ให้โหลดภาพแบบ priority (LCP) */
    priorityCount?: number
}) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 sm:gap-5">
            {movies.map((movie, index) => (
                <Link
                    key={movie.id}
                    href={`/title/${encodeURIComponent(movie.title)}`}
                    className="group flex flex-col active:scale-95 transition-transform"
                >
                    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800/90 group-hover:border-amber-500/70 transition duration-300 shadow-xl">
                        {/* Badge: จบแล้ว */}
                        {movie.is_completed && (
                            <div className="absolute top-2 right-2 z-10 bg-emerald-500/90 text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                                จบแล้ว
                            </div>
                        )}

                        {movie.poster_url ? (
                            <Image
                                src={movie.poster_url}
                                alt={movie.title}
                                fill
                                sizes="(max-width: 640px) 45vw, 15vw"
                                priority={index < priorityCount}
                                className="object-cover group-hover:scale-105 transition duration-500"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-700 text-xs">ไม่มีรูปโปสเตอร์</div>
                        )}

                        {/* Badge: จำนวนตอนจริง */}
                        <div className="absolute bottom-2 left-2 z-10 bg-black/70 backdrop-blur-sm text-zinc-200 text-[10px] font-bold px-2 py-0.5 rounded border border-zinc-700/50">
                            {epCounts[movie.id] || 0} ตอน
                        </div>
                    </div>

                    <div className="mt-2.5 px-0.5 space-y-0.5">
                        <h3 className="text-xs sm:text-sm font-bold text-zinc-200 group-hover:text-amber-400 transition truncate">
                            {movie.title}
                        </h3>
                        <p className="text-[10px] text-zinc-500 truncate">
                            {movie.genre || 'ซีรีส์สั้น'}
                        </p>
                    </div>
                </Link>
            ))}
        </div>
    )
}
