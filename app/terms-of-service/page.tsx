import type { Metadata } from 'next'
import LegalPage from '@/components/LegalPage'

export const metadata: Metadata = {
    title: 'ข้อตกลงและเงื่อนไข',
    description: 'ข้อตกลงและเงื่อนไขการใช้บริการ MOVIES AI',
}

export default function TermsOfServicePage() {
    return (
        <LegalPage title="ข้อตกลงและเงื่อนไขการใช้บริการ" updatedAt="1 พฤศจิกายน 2026">
            <section className="space-y-2">
                <h2 className="text-base font-bold text-white">1. การยอมรับข้อตกลง</h2>
                <p>
                    การเข้าใช้งานเว็บไซต์ถือว่าคุณยอมรับข้อตกลงฉบับนี้ หากไม่ยอมรับ กรุณาหยุดใช้งานบริการ
                </p>
            </section>

            <section className="space-y-2">
                <h2 className="text-base font-bold text-white">2. บัญชีผู้ใช้</h2>
                <p>
                    คุณมีหน้าที่รักษาความลับของรหัสผ่านและรับผิดชอบกิจกรรมทั้งหมดที่เกิดขึ้นภายใต้บัญชีของคุณ
                    ห้ามใช้ชื่อผู้ใช้ที่ละเมิดสิทธิของผู้อื่นหรือผิดกฎหมาย
                </p>
            </section>

            <section className="space-y-2">
                <h2 className="text-base font-bold text-white">3. สมาชิก VIP</h2>
                <p>
                    บางตอนอาจเปิดให้เฉพาะสมาชิก VIP สถานะสมาชิกมีผลตามระยะเวลาที่ระบุไว้ในระบบ
                    การยกเลิกหรือคืนเงินเป็นไปตามเงื่อนไขของผู้ให้บริการชำระเงิน
                </p>
            </section>

            <section className="space-y-2">
                <h2 className="text-base font-bold text-white">4. เนื้อหาและลิขสิทธิ์</h2>
                <p>
                    เนื้อหาทั้งหมดบนเว็บไซต์เป็นลิขสิทธิ์ของเจ้าของสิทธิ์ respective ห้ามบันทึก เผยแพร่ หรือใช้เชิงพาณิชย์
                    โดยไม่ได้รับอนุญาต
                </p>
            </section>

            <section className="space-y-2">
                <h2 className="text-base font-bold text-white">5. ข้อจำกัดความรับผิด</h2>
                <p>
                    บริการจัดให้ “ตามสภาพที่เป็นอยู่” เราอาจปรับปรุง หยุดให้บริการชั่วคราว หรือเปลี่ยนแปลงเนื้อหาโดยไม่แจ้งล่วงหน้า
                </p>
            </section>

            <p className="text-xs text-zinc-500">
                หมายเหตุ: หน้านี้เป็นข้อความตัวอย่างสำหรับการพัฒนาเว็บ ควรให้ฝ่ายกฎหมายตรวจสอบก่อนใช้งานจริง
            </p>
        </LegalPage>
    )
}
