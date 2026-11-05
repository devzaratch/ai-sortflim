'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Comment } from '@/lib/types'

export default function Comments({ movieId }: { movieId: string }) {
    const [comments, setComments] = useState<Comment[]>([])
    const [newComment, setNewComment] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        supabase
            .from('comments')
            .select('*')
            .eq('movie_id', movieId)
            .order('created_at', { ascending: true })
            .then(({ data, error }) => {
                if (error) {
                    console.error('Failed to load comments:', {
                        message: error.message,
                        code: error.code,
                        details: error.details,
                        hint: error.hint,
                    })
                } else {
                    setComments(data ?? [])
                }
            })
    }, [movieId])

    const addComment = async () => {
        if (!newComment.trim()) return
        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()

            const { error } = await supabase.from('comments').insert({
                movie_id: movieId,
                user_id: user?.id ?? null,
                content: newComment.trim(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })

            if (error) {
                console.error('Failed to add comment:', {
                    message: error.message,
                    code: error.code,
                    details: error.details,
                    hint: error.hint,
                })
                alert('ส่งความคิดเห็นไม่สำเร็จ กรุณาลองใหม่')
            } else {
                setNewComment('')
                // ดึงข้อมูลคอมเมนต์ใหม่ล่าสุดมาแสดงผลทันที
                const { data } = await supabase
                    .from('comments')
                    .select('*')
                    .eq('movie_id', movieId)
                    .order('created_at', { ascending: true })

                setComments(data ?? [])
            }
        } catch (err) {
            console.error('Unexpected error adding comment:', err)
            alert('เกิดข้อผิดพลาดบางประการ กรุณาลองใหม่')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="mt-8 border-t border-zinc-800/80 pt-6 space-y-4">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
                💬 ความคิดเห็น
            </h3>

            <div className="space-y-3">
                {comments.map((comment: Comment) => (
                    <div key={comment.id} className="p-3 bg-zinc-800/50 rounded-xl border border-zinc-800/60">
                        <div className="flex items-center gap-2 mb-1">
                            <img
                                className="w-6 h-6 rounded-full object-cover"
                                src={`https://gravatar.com/avatar/${comment.user_id ?? '000000'}?d=mp&s=40`}
                                alt="avatar"
                            />
                            <span className="text-xs text-zinc-300 font-medium">
                                {comment.user_id ? 'ผู้ใช้งาน' : 'ผู้ไม่ระบุชื่อ'}
                            </span>
                            <span className="text-xs text-zinc-500 ml-auto">
                                {new Date(comment.created_at).toLocaleDateString('th-TH')}
                            </span>
                        </div>
                        <p className="text-sm text-white whitespace-pre-wrap">{comment.content}</p>
                    </div>
                ))}
            </div>

            <div className="pt-4 border-t border-zinc-800/60 space-y-3">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="พิมพ์ความคิดเห็นของคุณที่นี่..."
                    rows={3}
                    className="w-full p-3 rounded-xl border border-zinc-700/60 bg-zinc-900/40 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 resize-none"
                    disabled={loading}
                />
                <button
                    onClick={addComment}
                    disabled={loading || !newComment.trim()}
                    className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-black text-xs tracking-wide transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'กำลังส่ง...' : 'ส่งความคิดเห็น'}
                </button>
            </div>
        </div>
    )
}