'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import AdminGate from '@/components/AdminGate'

function UploadForm() {
    const [title, setTitle] = useState('')
    const [genre, setGenre] = useState('')
    const [description, setDescription] = useState('')
    const [streamPath, setStreamPath] = useState('')
    const [episodeNumber, setEpisodeNumber] = useState('')
    const [movieId, setMovieId] = useState('')
    const [isCompleted, setIsCompleted] = useState(false)
    const [loading, setLoading] = useState(false)
    const [msg, setMsg] = useState('')
    const [msgType, setMsgType] = useState<'success' | 'error'>('success')

    const handleUpload = async () => {
        if (!title || !genre || !streamPath || !episodeNumber) {
            setMsg('กรอกข้อมูลให้ครบถ้วน')
            setMsgType('error')
            return
        }

        setLoading(true)

        try {
            // สร้างหรือใช้ movie ที่มีอยู่แล้ว
            let finalMovieId = movieId.trim()
            if (!finalMovieId) {
                const { data: movie } = await supabase
                    .from('movies')
                    .insert({
                        title,
                        description: description || null,
                        genre,
                        is_completed: isCompleted,
                        poster_url: null,
                        created_at: new Date().toISOString(),
                    })
                    .select('id')
                    .single()

                if (!movie?.id) throw new Error('ไม่สามารถสร้างเรื่องได้')
                finalMovieId = movie.id
            }

            const epNum = parseInt(episodeNumber, 10)

            const { error } = await supabase.from('episodes').insert({
                movie_id: finalMovieId,
                title: `EP.${epNum}`,
                episode_number: epNum,
                stream_path: streamPath,
                access_level: 'free',
                is_published: true,
                created_at: new Date().toISOString(),
            })

            if (error) throw error

            setMsg('อัปโหลดสำเร็จ!')
            setMsgType('success')
            setTitle('')
            setGenre('')
            setDescription('')
            setStreamPath('')
            setEpisodeNumber('')
        } catch (err) {
            setMsg(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
            setMsgType('error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="max-w-md mx-auto px-4 py-10 space-y-6">
                <div className="text-center">
                    <h1 className="text-2xl font-black text-white mb-2">อัปโหลดตอนใหม่</h1>
                    <p className="text-xs text-zinc-400">สำหรับครีเอเตอร์ที่ต้องการเพิ่มละคร</p>
                </div>

                {msg && (
                    <div
                        className={`p-3 rounded-xl text-xs border ${
                            msgType === 'success'
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                        }`}
                    >
                        {msg}
                    </div>
                )}

                <form onSubmit={(e) => { e.preventDefault(); handleUpload() }} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-400">ชื่อเรื่อง</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="เช่น ละครเรื่องใหม่"
                            className="w-full p-2 rounded-xl border border-zinc-700/60 bg-zinc-900 text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-400">แนวเรื่อง (คั่นด้วย comma)</label>
                        <input
                            type="text"
                            value={genre}
                            onChange={(e) => setGenre(e.target.value)}
                            placeholder="เช่น ดราม่า, โรแมนติก"
                            className="w-full p-2 rounded-xl border border-zinc-700/60 bg-zinc-900 text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-400">คำอธิบาย</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="รายละเอียดเรื่องย่อ"
                            rows={3}
                            className="w-full p-2 rounded-xl border border-zinc-700/60 bg-zinc-900 text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-400">ลิงก์วิดีโอ (stream_path)</label>
                        <input
                            type="url"
                            value={streamPath}
                            onChange={(e) => setStreamPath(e.target.value)}
                            placeholder="https://..."
                            className="w-full p-2 rounded-xl border border-zinc-700/60 bg-zinc-900 text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-400">หมายเลขตอน</label>
                        <input
                            type="number"
                            value={episodeNumber}
                            onChange={(e) => setEpisodeNumber(e.target.value)}
                            min="1"
                            className="w-full p-2 rounded-xl border border-zinc-700/60 bg-zinc-900 text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-400">รหัสเรื่อง (ถ้ามีอยู่แล้ว)</label>
                        <input
                            type="text"
                            value={movieId}
                            onChange={(e) => setMovieId(e.target.value)}
                            placeholder="ปล่อยว่างถ้าต้องการสร้างเรื่องใหม่"
                            className="w-full p-2 rounded-xl border border-zinc-700/60 bg-zinc-900 text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={isCompleted}
                            onChange={(e) => setIsCompleted(e.target.checked)}
                            className="rounded border-zinc-700 bg-zinc-900 text-amber-600 focus:ring-amber-500"
                        />
                        <label className="text-xs text-zinc-400">เรื่องนี้จบแล้ว</label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'กำลังอัปโหลด...' : 'อัปโหลดตอน'}
                    </button>
                </form>

                <div className="text-center mt-6">
                    <Link
                        href="/"
                        className="text-xs text-amber-400 hover:underline font-bold"
                    >
                        ← กลับหน้าแรก
                    </Link>
                </div>
        </main>
    )
}

export default function UploadPage() {
    return (
        <div className="min-h-screen bg-[#0b0b0d] text-white font-sans flex flex-col">
            <Header />
            <AdminGate>
                <UploadForm />
            </AdminGate>
        </div>
    )
}
