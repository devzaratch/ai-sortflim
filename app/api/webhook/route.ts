import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { getSupabaseAdminClient } from '@/lib/supabase-admin'

/**
 * Webhook endpoint สำหรับผู้ให้บริการชำระเงิน (Stripe / Omise / อื่น ๆ)
 *
 * ⚠️ สถานะปัจจุบัน: scaffold แบบ provider-agnostic — รอเลือก provider และ key
 *  1) ตั้ง PAYMENT_WEBHOOK_SECRET ใน .env.local (และ Vercel ภายหลัง)
 *  2) รัน supabase/payments.sql ใน Supabase Dashboard (ตาราง payments + subscriptions + RPC)
 *  3) เมื่อเลือก provider แล้ว:
 *     - Stripe: แนะนำตรวจด้วย stripe.webhooks.constructEvent() แทน HMAC เขียนเอง
 *     - Omise: ใช้ header Omise-Signature (HMAC-SHA256 เหมือนกัน แต่ format อาจต่าง)
 *  ตัวรับ event ด้านล่างรองรับ shape ทั่วไป: { type, data: { user_id, provider_ref, amount, ... } }
 */

interface WebhookEvent {
    type?: string
    data?: {
        user_id?: string
        provider_ref?: string
        provider?: string
        amount?: number
        currency?: string
        plan?: string
        period_days?: number
    }
}

/** ตรวจ HMAC-SHA256 (hex) ของ raw body เทียบกับ PAYMENT_WEBHOOK_SECRET */
function verifySignature(payload: string, signature: string | null, secret: string): boolean {
    if (!signature) return false

    const expected = createHmac('sha256', secret).update(payload).digest('hex')
    const a = Buffer.from(expected, 'utf8')
    const b = Buffer.from(signature.trim(), 'utf8')

    // เทียบแบบ timing-safe + ยาวต้องเท่ากัน
    return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(req: Request) {
    const secret = process.env.PAYMENT_WEBHOOK_SECRET
    if (!secret) {
        return NextResponse.json(
            { error: 'ยังไม่ได้ตั้งค่า PAYMENT_WEBHOOK_SECRET — webhook ยังไม่พร้อมใช้งาน' },
            { status: 503 },
        )
    }

    const payload = await req.text()
    const signature = req.headers.get('x-payment-signature')

    if (!verifySignature(payload, signature, secret)) {
        return NextResponse.json({ error: 'ลายเซ็นไม่ถูกต้อง' }, { status: 401 })
    }

    let event: WebhookEvent
    try {
        event = JSON.parse(payload) as WebhookEvent
    } catch {
        return NextResponse.json({ error: 'payload ไม่ใช่ JSON ที่ถูกต้อง' }, { status: 400 })
    }

    // รับเฉพาะ event ที่หมายถึง "จ่ายเงินสำเร็จ" (ปรับชื่อ event ตาม provider เมื่อเลือกได้)
    const succeededTypes = ['payment.succeeded', 'payment_intent.succeeded', 'charge.succeeded']
    if (!event.type || !succeededTypes.includes(event.type)) {
        // event อื่นรับแล้วตอบ ok เพื่อไม่ให้ provider ยิง retry รัว ๆ
        return NextResponse.json({ ok: true, ignored: event.type ?? null })
    }

    const data = event.data
    if (!data?.user_id || !data.provider_ref || typeof data.amount !== 'number') {
        return NextResponse.json(
            { error: 'ข้อมูลไม่ครบ: ต้องมี data.user_id, data.provider_ref, data.amount' },
            { status: 400 },
        )
    }

    const admin = getSupabaseAdminClient()
    if (!admin) {
        return NextResponse.json({ error: 'server ยังไม่ได้ตั้งค่า SUPABASE_SERVICE_ROLE_KEY' }, { status: 503 })
    }

    // เรียก RPC activate_subscription (security definer) — บันทึก payment + เปิด VIP
    const { error } = await admin.rpc('activate_subscription', {
        p_user_id: data.user_id,
        p_provider: data.provider ?? 'pending',
        p_provider_ref: data.provider_ref,
        p_amount: data.amount,
        p_currency: data.currency ?? 'THB',
        p_plan: data.plan ?? 'monthly',
        p_period_days: data.period_days ?? 30,
    })

    if (error) {
        console.error('activate_subscription failed:', error)
        return NextResponse.json({ error: 'เปิดสมาชิกไม่สำเร็จ' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, status: 'active' })
}
