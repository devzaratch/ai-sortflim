import type { MetadataRoute } from 'next'
import { getSupabaseServerClient } from '@/lib/supabase-server'

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const now = new Date()

    const routes: MetadataRoute.Sitemap = [
        { url: `${baseUrl}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
        { url: `${baseUrl}/movies`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
        { url: `${baseUrl}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
        { url: `${baseUrl}/privacy-policy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
        { url: `${baseUrl}/terms-of-service`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
        { url: `${baseUrl}/dmca`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    ]

    try {
        const supabase = getSupabaseServerClient()
        const { data } = await supabase
            .from('movies')
            .select('id, created_at')
            .order('created_at', { ascending: false })
            .limit(1000)

        for (const movie of data ?? []) {
            routes.push({
                url: `${baseUrl}/movie-detail?movieId=${movie.id}`,
                lastModified: movie.created_at ? new Date(movie.created_at) : now,
                changeFrequency: 'weekly',
                priority: 0.8,
            })
        }
    } catch {
        // ต่อฐานข้อมูลไม่ได้ตอน build — ปล่อย sitemap เฉพาะหน้า static ไว้ก่อน
    }

    return routes
}
