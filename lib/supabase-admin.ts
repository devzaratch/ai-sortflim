import { createClient } from '@supabase/supabase-js'

/**
 * Admin client (service_role) — ใช้ได้เฉพาะฝั่ง server เท่านั้น
 * ใช้สำหรับงานที่ผู้ใช้ทั่วไปไม่ควรทำได้เอง เช่น อัปเดตสถานะสมาชิกหลังชำระเงิน
 * ถ้าไม่ได้ตั้งค่า SUPABASE_SERVICE_ROLE_KEY จะคืนค่า null เพื่อให้ผู้เรียกจัดการต่อ
 */
export function getSupabaseAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !serviceKey) return null

    return createClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    })
}
