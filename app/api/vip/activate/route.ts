import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase-admin'

/**
 * ⚠️ endpoint จำลองการชำระเงิน (demo) — ไม่ใช่ระบบจ่ายเงินจริง
 *
 * ทำหน้าที่อัปเดตสถานะสมาชิกให้ผู้ใช้ที่ล็อกอินอยู่ โดยใช้ service_role key
 * ฝั่ง server เท่านั้น เพื่อไม่ให้ client เขียนตาราง subscriptions ได้เอง
 *
 * เมื่อทำระบบจริง: ลบ endpoint นี้ แล้วเปลี่ยนไปอัปเดตสถานะจาก webhook ของ
 * ผู้ให้บริการชำระเงิน (Stripe/Omise ฯลฯ) หลังยืนยันการจ่ายเงินสำเร็จ
 * และปิดด้วย ENABLE_VIP_SIMULATION=false
 */
export async function POST(request: Request) {
    if (process.env.ENABLE_VIP_SIMULATION === 'false') {
        return NextResponse.json({ error: 'ปิดการจำลองการชำระเงินแล้ว' }, { status: 403 })
    }

    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!token) {
        return NextResponse.json({ error: 'ต้องเข้าสู่ระบบก่อน' }, { status: 401 })
    }

    const admin = getSupabaseAdminClient()
    if (!admin) {
        return NextResponse.json(
            { error: 'ยังไม่ได้ตั้งค่า SUPABASE_SERVICE_ROLE_KEY ใน .env.local' },
            { status: 503 },
        )
    }

    const { data: { user }, error: authError } = await admin.auth.getUser(token)
    if (authError || !user) {
        return NextResponse.json({ error: 'เซสชันไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่' }, { status: 401 })
    }

    const { data: existing, error: selectError } = await admin
        .from('subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)

    if (selectError) {
        return NextResponse.json({ error: 'อ่านข้อมูลสมาชิกไม่สำเร็จ' }, { status: 500 })
    }

    if (existing && existing.length > 0) {
        const { error } = await admin
            .from('subscriptions')
            .update({ status: 'active', updated_at: new Date().toISOString() })
            .eq('user_id', user.id)

        if (error) {
            return NextResponse.json({ error: 'อัปเดตสถานะสมาชิกไม่สำเร็จ' }, { status: 500 })
        }
    } else {
        const { error } = await admin.from('subscriptions').insert({
            user_id: user.id,
            status: 'active',
        })

        if (error) {
            return NextResponse.json({ error: 'สร้างสถานะสมาชิกไม่สำเร็จ' }, { status: 500 })
        }
    }

    return NextResponse.json({ ok: true, status: 'active' })
}
