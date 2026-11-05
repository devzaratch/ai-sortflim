import { supabase } from './supabase'
import type { Movie } from './types'

// Supabase/PostgREST จำกัดจำนวนแถวต่อคำขอ (ค่าเริ่มต้น 1,000) จึงต้องแบ่งหน้าเอง
const PAGE_SIZE = 1000
const MAX_PAGES = 50

/** ดึงรายการละครทั้งหมด เรียงใหม่ล่าสุดก่อน */
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

/** ดึง movie_id ของทุกตอน (paginate จนครบ) เพื่อเอาไปนับจำนวนตอนต่อเรื่อง */
export async function fetchAllEpisodeMovieIds(): Promise<string[]> {
    const movieIds: string[] = []

    for (let page = 0; page < MAX_PAGES; page++) {
        const { data, error } = await supabase
            .from('episodes')
            .select('movie_id')
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

        if (error || !data || data.length === 0) break

        for (const row of data) {
            if (row.movie_id) movieIds.push(row.movie_id)
        }

        if (data.length < PAGE_SIZE) break
    }

    return movieIds
}

/** นับจำนวนตอนต่อ movie id */
export function countEpisodesByMovie(movieIds: string[]): Record<string, number> {
    const counts: Record<string, number> = {}
    for (const movieId of movieIds) {
        counts[movieId] = (counts[movieId] || 0) + 1
    }
    return counts
}

/** ดึงจำนวนตอนต่อเรื่องในคำสั่งเดียว */
export async function fetchEpisodeCounts(): Promise<Record<string, number>> {
    return countEpisodesByMovie(await fetchAllEpisodeMovieIds())
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
        .select('*')
        .neq('id', movieId)
        .ilike('genre', `%${genre}%`)
        .limit(3)

    return (data || []) as Movie[]
}