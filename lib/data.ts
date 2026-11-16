import { supabase } from './supabase'
import type { Movie } from './types'

// คอลัมน์ที่จำเป็นสำหรับการ์ด/ลิสต์ (ไม่รวม description ที่ใช้แค่ในหน้า detail)
const MOVIE_LIST_COLUMNS = 'id, title, poster_url, genre, is_completed, created_at'

/**
 * ดึงรายการละครสำหรับการ์ด/ลิสต์ — เบา กว่า fetchAllMovies
 * ใช้ในหน้าแรก, /movies (หน้าที่แสดงเป็น grid)
 */
export async function fetchMoviesList(): Promise<Movie[]> {
    const { data, error } = await supabase
        .from('movies')
        .select(MOVIE_LIST_COLUMNS)
        .order('created_at', { ascending: false })

    if (error || !data) {
        if (error) console.error('Failed to fetch movies list:', error)
        return []
    }

    return data as Movie[]
}

/**
 * ดึงรายการละครทั้งหมด (ทุกคอลัมน์) — สำหรับหน้า detail / admin
 */
export async function fetchAllMovies(): Promise<Movie[]> {
    const { data, error } = await supabase
        .from('movies')
        .select('*')
        .order('created_at', { ascending: false })

    if (error || !data) {
        if (error) console.error('Failed to fetch movies:', error)
        return []
    }

    return data as Movie[]
}

/**
 * ดึงจำนวนตอนต่อเรื่องจาก view episode_counts (สร้างใน supabase/views.sql)
 * ⚡ ข้อมูลถูกบันทึกใน DB ล่วงหน้า → ไม่ต้อง fetch ทุกแถว episodes
 * คำขอเดียวได้ทั้งหมด แทนการวนหลายหน้า (1,000 แถว/หน้า)
 */
export async function fetchEpisodeCounts(): Promise<Record<string, number>> {
    const { data, error } = await supabase
        .from('episode_counts')
        .select('movie_id, episode_count')

    if (error || !data) {
        if (error) console.error('Failed to fetch episode counts:', error)
        return {}
    }

    const counts: Record<string, number> = {}
    for (const row of data) {
        if (row.movie_id) counts[row.movie_id] = row.episode_count ?? 0
    }
    return counts
}

/** แนะนำเรื่องที่คล้ายกัน โดยอ้างอิงจากแนว (genre) แรกของเรื่องที่ส่งเข้ามา */
export async function fetchRecommendations(movieId: string): Promise<Movie[]> {
    const { data: movie } = await supabase
        .from('movies')
        .select('genre')
        .eq('id', movieId)
        .maybeSingle()

    if (!movie || !movie.genre) return []

    const genre = movie.genre.split(',')[0].trim()

    const { data } = await supabase
        .from('movies')
        .select(MOVIE_LIST_COLUMNS)
        .neq('id', movieId)
        .ilike('genre', `%${genre}%`)
        .limit(3)

    return (data || []) as Movie[]
}