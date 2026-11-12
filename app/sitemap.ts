import type { MetadataRoute } from 'next'
import { getSupabaseServerClient } from '@/lib/supabase-server'

/**
 * sitemap.xml แบบ dynamic — สร้างจากชื่อเรื่องทั้งหมดใน Supabase
 * ใช้ 'use cache' เพื่อให้ generate ได้ตอน build (Cache Components)
 */

interface MovieSlugRow {
    title: string
    created_at: string | null
}

async function getMovieSlugs(): Promise<MovieSlugRow[]> {
    'use cache'
    try {
        const supabase = getSupabaseServerClient()
        const { data } = await supabase.from('movies').select('title, created_at')
        return (data as MovieSlugRow[]) ?? []
    } catch {
        return []
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

    const staticPaths: MetadataRoute.Sitemap = ['', '/movies', '/login'].map((path) => ({
        url: `${siteUrl}${path}`,
        changeFrequency: 'daily',
        priority: path === '' ? 1 : 0.8,
    }))

    const movies = await getMovieSlugs()
    const moviePaths: MetadataRoute.Sitemap = movies
        .filter((m) => Boolean(m.title))
        .map((m) => ({
            url: `${siteUrl}/title/${encodeURIComponent(m.title)}`,
            lastModified: m.created_at ? new Date(m.created_at) : undefined,
            changeFrequency: 'daily' as const,
            priority: 0.7,
        }))

    return [...staticPaths, ...moviePaths]
}
