import { NextResponse } from 'next/server'
import { connection } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'

/**
 * Health check — ใช้กับ uptime monitor (เช่น Vercel checks / UptimeRobot / GitHub Action)
 * ตอบ 200 เมื่อ: Supabase เชื่อมได้ + ตาราง movies + view episode_counts (จาก views.sql) ใช้งานได้
 * ตอบ 503 เมื่อใดอย่างหนึ่งล้ม เพื่อให้ monitor แจ้งเตือนได้
 *
 * ตอบแบบ no-store กัน CDN/บราว์เซอร์แคชผลลัพธ์เก่า
 * (connection() = route นี้ต้องเรียกตอน request จริง — Cache Components ไม่ prerender)
 */

export async function GET() {
    await connection()
    try {
        const supabase = getSupabaseServerClient()

        // นับเรื่อง + นับตอนผ่าน view — จับทั้งตารางและ views.sql ใน query เดียว
        const [{ count: movieCount, error: movieError }, { error: countsError }] = await Promise.all([
            supabase.from('movies').select('*', { count: 'exact', head: true }),
            supabase.from('episode_counts').select('*', { count: 'exact', head: true }),
        ])

        if (movieError || countsError) {
            return NextResponse.json(
                {
                    status: 'unhealthy',
                    database: 'error',
                    movies: movieError ? movieError.message : 'ok',
                    episode_counts: countsError ? countsError.message : 'ok',
                },
                { status: 503, headers: { 'Cache-Control': 'no-store' } }
            )
        }

        return NextResponse.json(
            {
                status: 'ok',
                database: 'ok',
                movies: movieCount ?? 0,
            },
            { headers: { 'Cache-Control': 'no-store' } }
        )
    } catch (err) {
        return NextResponse.json(
            { status: 'unhealthy', error: err instanceof Error ? err.message : 'unknown' },
            { status: 503, headers: { 'Cache-Control': 'no-store' } }
        )
    }
}
