/**
 * Webhook endpoint สำหรับ Stripe/Omise (ใช้ตอน production)
 * ปัจจุบันเป็น template — ต้องตั้งค่า STRIPE_SECRET, STRIPE_WEBHOOK_SECRET ใน .env.local
 * และสร้าง account Stripe ก่อนใช้งานจริง
 */

export async function POST(req: Request) {
    const payload = await req.text()
    const sig = req.headers.get('stripe-signature')

    // ปัจจุบันยังไม่ตรวจสอบ signature (เพราะยังไม่มี webhook secret)
    // เมื่อมี account Stripe แล้ว ให้นำ webhook secret มาใส่และตรวจสอบด้วย stripe.webhooks.constructEvent()

    console.log('Webhook received:', payload.slice(0, 200))
    return new Response('Webhook received', { status: 200 })
}
