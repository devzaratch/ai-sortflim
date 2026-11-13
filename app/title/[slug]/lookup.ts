import { getSupabaseServerClient } from '@/lib/supabase-server'
import type { Movie } from '@/lib/types'

/**
 * ค้นหาเรื่องจากชื่อ (ใช้ร่วมกันระหว่างหน้า /title/[slug] และหน้าดูตอน /title/[slug]/watch)
 * ใช้ 'use cache' เพื่อให้ prerender ได้ต่อชื่อ (ตาม docs ของ Next 16)
 */
export async function getMovieByTitle(title: string): Promise<Movie | null> {
    'use cache'
    try {
        const supabase = getSupabaseServerClient()
        const { data } = await supabase
            .from('movies')
            .select('*')
            .eq('title', title)
            .limit(1)
            .maybeSingle()
        return (data as Movie) ?? null
    } catch {
        return null
    }
}

/** ถอดรหัส slug (บราว์เซอร์ส่งชื่อไทยมาเป็น percent-encoded) */
export function resolveTitle(slug: string): string {
    try {
        return decodeURIComponent(slug)
    } catch {
        return slug
    }
}
