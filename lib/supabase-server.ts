import { createClient } from '@supabase/supabase-js'

/**
 * Supabase client สำหรับใช้ฝั่ง server (Server Component / generateMetadata / route handler)
 * - ไม่เก็บ session ไว้ในหน่วยความจำของ process
 * - ใช้ anon key ซึ่งอ่านข้อมูลสาธารณะได้ตาม RLS เท่านั้น
 */
export function getSupabaseServerClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }

    return createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
    })
}
