import { supabase } from './supabase'

/**
 * ระบบนับยอดวิว — บันทึกผ่าน RPC record_view (supabase/views.sql)
 * และดึงยอดรวมไปแสดงหน้า "ยอดนิยม"
 */

const VIEW_THROTTLE_KEY = 'view_throttle'
/** บันทึกได้เรื่องละครั้งต่อ 6 ชั่วโมงต่อเบราว์เซอร์ กันสแปม */
const THROTTLE_MS = 6 * 60 * 60 * 1000

function readThrottleMap(): Record<string, number> {
    try {
        const raw = localStorage.getItem(VIEW_THROTTLE_KEY)
        return raw ? (JSON.parse(raw) as Record<string, number>) : {}
    } catch {
        return {}
    }
}

function writeThrottleMap(map: Record<string, number>) {
    try {
        localStorage.setItem(VIEW_THROTTLE_KEY, JSON.stringify(map))
    } catch {
        // localStorage ใช้ไม่ได้ (เช่น private mode) — ปล่อยผ่าน
    }
}

/** บันทึกยอดวิว 1 ครั้ง (มี throttle กันสแปมฝั่ง client) */
export async function recordView(movieId: string): Promise<void> {
    if (!movieId) return

    const now = Date.now()
    const map = readThrottleMap()
    const last = map[movieId] || 0

    if (now - last < THROTTLE_MS) return

    // เขียน throttle ก่อนยิง RPC เพื่อกันยิงซ้ำรัว ๆ ระหว่างรอ response
    map[movieId] = now
    writeThrottleMap(map)

    const { error } = await supabase.rpc('record_view', { p_movie_id: movieId })
    if (error) console.error('record_view failed:', error)
}

/** ดึงยอดวิวทุกเรื่อง (มี pagination กันตัดที่ 1,000 แถว) */
export async function fetchViewCounts(): Promise<Record<string, number>> {
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

/** แสดงตัวเลขแบบ 1.2K / 3.4M เพื่อไม่ให้ badge ยาวเกิน */
export function formatViews(views: number): string {
    if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`
    if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`
    return String(views)
}
