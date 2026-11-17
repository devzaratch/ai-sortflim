import { getSupabaseServerClient } from './supabase-server'
import type { Movie } from './types'

/**
 * ข้อมูลฝั่ง server สำหรับหน้าแบบ Server Component (Wave 3 ข้อ 5)
 * - คอลัมน์เบาเท่าที่ใช้จริง
 * - 'use cache' เพื่อให้ Cache Components แคชได้ (รวมกลุ่มข้อมูลนิ่ง ๆ เช่น ลิสต์เรื่อง)
 * - ใช้ anon key ตาม RLS → เห็นเฉพาะข้อมูลสาธารณะ
 */

/** คอลัมน์ที่จำเป็นสำหรับการ์ด/ลิสต์ (ไม่รวม description) */
export const MOVIE_LIGHT_COLUMNS = 'id, title, poster_url, genre, is_completed, created_at'

/** ลิสต์เรื่องทั้งหมด (คอลัมน์เบา) — แคชไว้ เพราะข้อมูลชุดนี้เปลี่ยนนานครั้ง */
export async function getMoviesLight(): Promise<Movie[]> {
    'use cache'
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
        .from('movies')
        .select(MOVIE_LIGHT_COLUMNS)
        .order('created_at', { ascending: false })

    if (error || !data) {
        if (error) console.error('getMoviesLight failed:', error.message)
        return []
    }
    return data as Movie[]
}

/** เรื่องเด่น Hero (5 เรื่องล่าสุด พร้อม description) — แคชไว้ */
export async function getHeroMovies(count = 5): Promise<Movie[]> {
    'use cache'
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
        .from('movies')
        .select('id, title, poster_url, genre, description, is_completed, created_at')
        .order('created_at', { ascending: false })
        .limit(count)

    if (error || !data) {
        if (error) console.error('getHeroMovies failed:', error.message)
        return []
    }
    return data as Movie[]
}

/** ยอดวิวทุกเรื่อง (มี pagination กันตัดที่ 1,000 แถว) — แคชไว้ */
export async function getViewCounts(): Promise<Record<string, number>> {
    'use cache'
    const supabase = getSupabaseServerClient()
    const PAGE_SIZE = 1000
    const out: Record<string, number> = {}

    for (let page = 0; page < 50; page++) {
        const { data, error } = await supabase
            .from('view_counts')
            .select('movie_id, views')
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

        if (error || !data || data.length === 0) break

        for (const row of data) {
            out[row.movie_id] = Number(row.views) || 0
        }

        if (data.length < PAGE_SIZE) break
    }

    return out
}

/** จำนวนตอนต่อเรื่องจาก view episode_counts — แคชไว้เช่นกัน */
export async function getEpisodeCounts(): Promise<Record<string, number>> {
    'use cache'
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
        .from('episode_counts')
        .select('movie_id, episode_count')

    if (error || !data) {
        if (error) console.error('getEpisodeCounts failed:', error.message)
        return {}
    }

    const counts: Record<string, number> = {}
    for (const row of data) {
        if (row.movie_id) counts[row.movie_id] = row.episode_count ?? 0
    }
    return counts
}

/** นับจำนวนเรื่องต่อแนว (จากลิสต์ที่ส่งเข้า) — เหมือน logic เดิมฝั่ง client */
export function computeGenreCounts(movies: Movie[]): Record<string, number> {
    const counts: Record<string, number> = {}
    for (const m of movies) {
        const genres = m.genre ? m.genre.split(',').map((t) => t.trim()) : ['อื่นๆ']
        for (const g of genres) {
            counts[g] = (counts[g] || 0) + 1
        }
    }
    return counts
}
