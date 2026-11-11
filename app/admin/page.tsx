'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'

interface Stat {
    label: string
    value: number
    color: string
}

interface GenreStat {
    genre: string
    count: number
}

interface CommentStat {
    user: string
    content: string
    date: string
}

async function countRows(table: 'movies' | 'episodes' | 'profiles' | 'watch_history'): Promise<number> {
    const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })

    if (error) {
        console.error(`Failed to count ${table}:`, error)
        return 0
    }
    return count ?? 0
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stat[]>([])
    const [genres, setGenres] = useState<GenreStat[]>([])
    const [comments, setComments] = useState<CommentStat[]>([])
    const [loading, setLoading] = useState(true)

    const fetchStats = async () => {
        const [moviesCount, episodesCount, usersCount, historyCount, movieRows, commentRows] = await Promise.all([
            countRows('movies'),
            countRows('episodes'),
            countRows('profiles'),
            countRows('watch_history'),
            supabase.from('movies').select('genre'),
            supabase.from('comments').select('user_id, content, created_at').order('created_at', { ascending: false }).limit(5),
        ])

        // นับแนวเรื่องจากคอลัมน์ genre (คั่นหลายแนวด้วย comma)
        const genreCounter: Record<string, number> = {}
        for (const row of movieRows.data ?? []) {
            const list = (row.genre ?? '').split(',').map((g: string) => g.trim()).filter(Boolean)
            for (const g of list) genreCounter[g] = (genreCounter[g] ?? 0) + 1
        }
        const genreStats = Object.entries(genreCounter)
            .map(([genre, count]) => ({ genre, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6)

        const commentStats: CommentStat[] = (commentRows.data ?? []).map((c) => ({
            user: c.user_id ? 'สมาชิก' : 'ผู้ไม่ระบุชื่อ',
            content: c.content,
            date: new Date(c.created_at).toLocaleDateString('th-TH'),
        }))

        setStats([
            { label: 'เรื่อง', value: moviesCount, color: 'text-emerald-400' },
            { label: 'ตอน', value: episodesCount, color: 'text-amber-400' },
            { label: 'ผู้ใช้', value: usersCount, color: 'text-sky-400' },
            { label: 'ดูต่อ', value: historyCount, color: 'text-violet-400' },
        ])
        setGenres(genreStats)
        setComments(commentStats)
        setLoading(false)
    }

    useEffect(() => {
        fetchStats()
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0b0b0d] text-white flex items-center justify-center">
                <div className="flex items-center gap-6">
                    <div className="w-10 h-10 border-2 border-zinc-700 border-t-amber-500 rounded-full animate-spin" />
                    <p className="text-lg text-zinc-300">กำลังโหลดสถิติ...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0b0b0d] text-white font-sans">
            <Header />

            <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
                <div>
                    <h1 className="text-2xl font-black text-white mb-1">แดชบอร์ดแอดมิน</h1>
                    <p className="text-sm text-zinc-400">สรุปสถิติของระบบ</p>
                </div>

                <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stats.map((s) => (
                        <div key={s.label} className="bg-zinc-900/80 border border-zinc-800/60 rounded-xl p-4">
                            <div className={`text-3xl font-black ${s.color}`}>{s.value.toLocaleString('th-TH')}</div>
                            <p className="text-xs text-zinc-400 mt-1">{s.label}</p>
                        </div>
                    ))}
                </section>

                <section className="bg-zinc-900/80 border border-zinc-800/60 rounded-xl p-6">
                    <h2 className="text-lg font-bold text-white mb-4">แนวเรื่องยอดนิยม</h2>
                    {genres.length === 0 ? (
                        <p className="text-sm text-zinc-500">ยังไม่มีข้อมูล</p>
                    ) : (
                        <div className="space-y-2">
                            {genres.map((g) => (
                                <div key={g.genre} className="flex items-center gap-3">
                                    <span className="text-sm text-zinc-300 w-32 truncate">{g.genre}</span>
                                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-amber-500 rounded-full"
                                            style={{ width: `${(g.count / genres[0].count) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-bold text-amber-400 w-8 text-right">{g.count}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="bg-zinc-900/80 border border-zinc-800/60 rounded-xl p-6">
                    <h2 className="text-lg font-bold text-white mb-4">ความคิดเห็นล่าสุด</h2>
                    {comments.length === 0 ? (
                        <p className="text-sm text-zinc-500">ยังไม่มีความคิดเห็น (ถ้าเพิ่งสร้างตาราง ให้รัน `supabase/comments.sql` ก่อน)</p>
                    ) : (
                        <div className="space-y-3">
                            {comments.map((c, i) => (
                                <div key={i} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-800/60">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-zinc-300 font-medium">{c.user}</span>
                                        <span className="text-xs text-zinc-500">{c.date}</span>
                                    </div>
                                    <p className="text-sm text-white whitespace-pre-wrap">{c.content}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    )
}
