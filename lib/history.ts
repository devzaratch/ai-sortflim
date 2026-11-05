import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { ContinueWatchingItem, Movie } from './types'

const STORAGE_KEY = 'continue_watching_history'
const MAX_ITEMS = 10

function isBrowser() {
    return typeof window !== 'undefined'
}

/** อ่านประวัติจาก localStorage (ใช้ได้ทั้งผู้ใช้ที่ล็อกอินและไม่ล็อกอิน) */
export function readLocalHistory(): ContinueWatchingItem[] {
    if (!isBrowser()) return []
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []
        return (parsed as ContinueWatchingItem[]).sort((a, b) => b.updatedAt - a.updatedAt)
    } catch {
        return []
    }
}

export function writeLocalHistory(items: ContinueWatchingItem[]) {
    if (!isBrowser()) return
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)))
    } catch {
        // localStorage อาจถูกบล็อก (private mode) — ไม่ใช่เรื่องคอขาดบาดตาย
    }
}

export function clearLocalHistory() {
    if (!isBrowser()) return
    try {
        window.localStorage.removeItem(STORAGE_KEY)
    } catch {
        // ignore
    }
}

/** ดึงประวัติจากตาราง watch_history ของผู้ใช้ที่ล็อกอิน */
export async function fetchServerHistory(userId: string): Promise<ContinueWatchingItem[]> {
    const { data, error } = await supabase
        .from('watch_history')
        .select(`
            movie_id,
            last_ep,
            total_ep,
            updated_at,
            movies (
                id,
                title,
                poster_url
            )
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

    if (error || !data) return []

    return data.map((item) => {
        const movie = Array.isArray(item.movies) ? item.movies[0] : item.movies
        return {
            movieId: item.movie_id,
            movieTitle: movie?.title || 'ไม่ระบุชื่อเรื่อง',
            posterUrl: movie?.poster_url || '',
            lastEp: item.last_ep,
            totalEp: item.total_ep || 0,
            updatedAt: item.updated_at ? new Date(item.updated_at).getTime() : 0,
        }
    })
}

interface SaveProgressInput {
    user: User | null
    movie: Pick<Movie, 'id' | 'title' | 'poster_url'>
    episodeNumber: number
    totalEpisodes: number
}

/**
 * บันทึกความคืบหน้าการดู
 * - เขียนลง localStorage เสมอ (รองรับผู้ใช้ที่ยังไม่ล็อกอิน)
 * - ถ้าล็อกอินอยู่ จะ sync ลง Supabase ด้วย เพื่อให้ "ดูต่อ" ข้ามอุปกรณ์ได้
 */
export async function saveWatchProgress({ user, movie, episodeNumber, totalEpisodes }: SaveProgressInput) {
    const entry: ContinueWatchingItem = {
        movieId: movie.id,
        movieTitle: movie.title,
        posterUrl: movie.poster_url || '',
        lastEp: episodeNumber,
        totalEp: totalEpisodes,
        updatedAt: Date.now(),
    }

    const remaining = readLocalHistory().filter((item) => item.movieId !== movie.id)
    writeLocalHistory([entry, ...remaining])

    if (!user) return

    // ตาราง watch_history มี unique constraint ที่ (user_id, movie_id) อยู่แล้ว
    // จึงใช้ upsert เพื่อกันทั้ง duplicate key (23505) และ race condition ตอน effect ทำงานซ้ำ
    const { error } = await supabase.from('watch_history').upsert(
        {
            user_id: user.id,
            movie_id: movie.id,
            last_ep: episodeNumber,
            total_ep: totalEpisodes,
            updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,movie_id' },
    )

    if (error) console.error('Failed to save watch history:', error)
}

/** ล้างประวัติการดูทั้งใน localStorage และ Supabase */
export async function clearWatchHistory(user: User | null) {
    if (user) {
        await supabase.from('watch_history').delete().eq('user_id', user.id)
    }
    clearLocalHistory()
}
