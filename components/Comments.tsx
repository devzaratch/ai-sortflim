'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import { LogIn, MessageCircle, Send, Trash2, X } from 'lucide-react'
import type { Comment } from '@/lib/types'

/**
 * Comments 2.0 (Wave 3 ข้อ 7)
 * - ต้องล็อกอินก่อนแสดงฟอร์ม (RLS กัน anon เขียนอยู่แล้ว → ทำให้ UX สอดคล้อง)
 * - จำกัดส่ง 1 คอมเมนต์ / 30 วินาทีต่อเรื่อง (กันสแปมฝั่ง client)
 * - ลบคอมเมนต์ของตัวเองได้ (ยืนยัน 2 จังหวะ ไม่ใช้ confirm())
 * - ไม่ใช้ alert() — แจ้งผลด้วยข้อความ inline
 */

const RATE_LIMIT_MS = 30 * 1000
const THROTTLE_KEY = 'comment_throttle'
const MAX_LENGTH = 500

function readThrottleMap(): Record<string, number> {
    try {
        const raw = localStorage.getItem(THROTTLE_KEY)
        return raw ? (JSON.parse(raw) as Record<string, number>) : {}
    } catch {
        return {}
    }
}

function writeThrottleMap(map: Record<string, number>) {
    try {
        localStorage.setItem(THROTTLE_KEY, JSON.stringify(map))
    } catch {
        // localStorage ใช้ไม่ได้ (เช่น private mode) — ปล่อยผ่าน
    }
}

export default function Comments({ movieId }: { movieId: string }) {
    const [comments, setComments] = useState<Comment[]>([])
    const [newComment, setNewComment] = useState('')
    const [loading, setLoading] = useState(false)
    const [user, setUser] = useState<User | null>(null)
    const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    /** id ของคอมเมนต์ที่กดลบครั้งแรก (รอยืนยันรอบที่สอง) */
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

    const loadComments = async () => {
        const { data, error } = await supabase
            .from('comments')
            .select('*')
            .eq('movie_id', movieId)
            .order('created_at', { ascending: true })

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
    }

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

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })
        return () => listener.subscription.unsubscribe()
    }, [])

    const addComment = async () => {
        if (!newComment.trim() || !user) return

        // Rate limit: ส่งได้เรื่องละครั้งต่อ 30 วินาที
        const now = Date.now()
        const map = readThrottleMap()
        const last = map[movieId] || 0
        if (now - last < RATE_LIMIT_MS) {
            const waitSec = Math.ceil((RATE_LIMIT_MS - (now - last)) / 1000)
            setMsg({ type: 'error', text: `ส่งได้อีกครั้งในอีก ${waitSec} วินาที — ช่วยกันสแปมนิดนึงนะ` })
            return
        }

        setLoading(true)
        setMsg(null)

        try {
            const { error } = await supabase.from('comments').insert({
                movie_id: movieId,
                user_id: user.id,
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
                setMsg({ type: 'error', text: 'ส่งความคิดเห็นไม่สำเร็จ กรุณาลองใหม่' })
            } else {
                map[movieId] = now
                writeThrottleMap(map)
                setNewComment('')
                await loadComments()
                setMsg({ type: 'success', text: 'ส่งความคิดเห็นแล้ว ขอบคุณที่ร่วมแชร์นะ' })
            }
        } catch (err) {
            console.error('Unexpected error adding comment:', err)
            setMsg({ type: 'error', text: 'เกิดข้อผิดพลาดบางประการ กรุณาลองใหม่' })
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (commentId: string) => {
        // กดครั้งแรก = แสดงปุ่มยืนยัน / กดซ้ำ = ลบจริง
        if (pendingDeleteId !== commentId) {
            setPendingDeleteId(commentId)
            return
        }

        setPendingDeleteId(null)

        const { error } = await supabase
            .from('comments')
            .delete()
            .eq('id', commentId)

        if (error) {
            console.error('Failed to delete comment:', error)
            setMsg({ type: 'error', text: 'ลบความคิดเห็นไม่สำเร็จ กรุณาลองใหม่' })
        } else {
            await loadComments()
            setMsg({ type: 'success', text: 'ลบความคิดเห็นแล้ว' })
        }
    }

    return (
        <div className="mt-8 border-t border-zinc-800/80 pt-6 space-y-4">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-amber-400" aria-hidden="true" />
                ความคิดเห็น
                <span className="text-xs font-bold text-zinc-500">{comments.length}</span>
            </h3>

            <div className="space-y-3">
                {comments.map((comment: Comment) => {
                    const isOwn = comment.user_id === user?.id
                    const confirmingDelete = pendingDeleteId === comment.id

                    return (
                        <div key={comment.id} className="p-3 bg-zinc-800/50 rounded-xl border border-zinc-800/60">
                            <div className="flex items-center gap-2 mb-1">
                                <Image
                                    className="w-6 h-6 rounded-full object-cover"
                                    src={`https://gravatar.com/avatar/${comment.user_id ?? '000000'}?d=mp&s=40`}
                                    alt=""
                                    width={24}
                                    height={24}
                                />
                                <span className="text-xs text-zinc-300 font-medium">
                                    {comment.user_id ? (isOwn ? 'คุณ' : 'ผู้ใช้งาน') : 'ผู้ไม่ระบุชื่อ'}
                                </span>
                                <span className="text-xs text-zinc-500 ml-auto">
                                    {new Date(comment.created_at).toLocaleDateString('th-TH')}
                                </span>
                            </div>

                            <div className="flex items-start gap-2">
                                <p className="text-sm text-white whitespace-pre-wrap flex-1">{comment.content}</p>

                                {isOwn && (
                                    confirmingDelete ? (
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                onClick={() => handleDelete(comment.id)}
                                                className="min-h-9 px-3 rounded-lg bg-rose-500/90 hover:bg-rose-500 text-white text-[11px] font-black transition active:scale-95"
                                                aria-label="ยืนยันการลบความคิดเห็น"
                                            >
                                                ยืนยันลบ
                                            </button>
                                            <button
                                                onClick={() => setPendingDeleteId(null)}
                                                className="min-h-9 min-w-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition active:scale-95"
                                                aria-label="ยกเลิกการลบ"
                                            >
                                                <X className="w-4 h-4" aria-hidden="true" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleDelete(comment.id)}
                                            className="min-h-9 min-w-9 shrink-0 rounded-lg text-zinc-600 hover:text-rose-400 hover:bg-zinc-800 flex items-center justify-center transition active:scale-95"
                                            aria-label="ลบความคิดเห็นนี้"
                                        >
                                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    )
                })}

                {comments.length === 0 && (
                    <p className="text-xs text-zinc-500 py-4 text-center">ยังไม่มีความคิดเห็น — เป็นคนแรกที่ร่วมแชร์ได้เลย</p>
                )}
            </div>

            {/* ยังไม่ล็อกอิน → ชวนเข้าสู่ระบบ แทนการแสดงฟอร์มที่ส่งไม่ได้ */}
            {!user ? (
                <div className="pt-4 border-t border-zinc-800/60">
                    <div className="flex flex-col sm:flex-row items-center gap-3 bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
                        <LogIn className="w-5 h-5 text-amber-400 shrink-0" aria-hidden="true" />
                        <p className="text-xs text-zinc-400 flex-1 text-center sm:text-left leading-relaxed">
                            เข้าสู่ระบบเพื่อร่วมแสดงความคิดเห็น
                        </p>
                        <Link
                            href="/login"
                            className="min-h-11 flex items-center justify-center px-5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-[#1c1917] font-extrabold text-xs active:scale-95 transition"
                        >
                            เข้าสู่ระบบ
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="pt-4 border-t border-zinc-800/60 space-y-3">
                    {msg && (
                        <p
                            role="status"
                            className={`text-xs font-bold px-3 py-2 rounded-xl ${
                                msg.type === 'success'
                                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                            }`}
                        >
                            {msg.text}
                        </p>
                    )}

                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value.slice(0, MAX_LENGTH))}
                        placeholder="พิมพ์ความคิดเห็นของคุณที่นี่..."
                        rows={3}
                        maxLength={MAX_LENGTH}
                        enterKeyHint="send"
                        className="w-full p-3 rounded-xl border border-zinc-700/60 bg-zinc-900/40 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none"
                        disabled={loading}
                    />

                    <div className="flex items-center gap-3">
                        <span className="text-[10px] text-zinc-600 ml-auto" aria-hidden="true">
                            {newComment.length}/{MAX_LENGTH}
                        </span>
                        <button
                            onClick={addComment}
                            disabled={loading || !newComment.trim()}
                            className="min-h-11 flex-1 flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-black text-xs tracking-wide transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                        >
                            <Send className="w-4 h-4" aria-hidden="true" />
                            {loading ? 'กำลังส่ง...' : 'ส่งความคิดเห็น'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
