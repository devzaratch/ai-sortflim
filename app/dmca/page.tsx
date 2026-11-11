import type { Metadata } from 'next'
import LegalPage from '@/components/LegalPage'

export const metadata: Metadata = {
    title: 'แจ้งละเมิดลิขสิทธิ์ (DMCA)',
    description: 'ช่องทางแจ้งเตือนและขอให้ลบเนื้อหาที่ละเมิดลิขสิทธิ์',
}

export default function DmcaPage() {
    return (
        <LegalPage title="แจ้งละเมิดลิขสิทธิ์ (DMCA)" updatedAt="1 พฤศจิกายน 2026">
            <section className="space-y-2">
                <h2 className="text-base font-bold text-white">1. หลักการ</h2>
                <p>
                    เราเคารพสิทธิในทรัพย์สินทางปัญญาของผู้อื่น หากคุณเป็นเจ้าของสิทธิ์หรือผู้รับมอบอำนาจ
                    และเชื่อว่าเนื้อหาบนเว็บไซต์ละเมิดลิขสิทธิ์ของคุณ โปรดแจ้งเราตามช่องทางด้านล่าง
                </p>
            </section>

            <section className="space-y-2">
                <h2 className="text-base font-bold text-white">2. ข้อมูลที่ต้องระบุในการแจ้ง</h2>
                <ul className="list-disc pl-5 space-y-1">
                    <li>ชื่อและข้อมูลติดต่อของผู้แจ้ง (อีเมลและเบอร์โทร)</li>
                    <li>รายละเอียดผลงานที่มีลิขสิทธิ์ พร้อมหลักฐานการเป็นเจ้าของสิทธิ์</li>
                    <li>URL ของหน้าที่อ้างว่าละเมิด พร้อมคำอธิบายประกอบ</li>
                    <li>คำรับรองว่าข้อมูลที่แจ้งเป็นความจริงและผู้แจ้งมีสิทธิ์ดำเนินการแทนเจ้าของสิทธิ์</li>
                    <li>ลายมือชื่ออิเล็กทรอนิกส์ของผู้แจ้ง</li>
                </ul>
            </section>

            <section className="space-y-2">
                <h2 className="text-base font-bold text-white">3. ช่องทางติดต่อ</h2>
                <p>
                    ส่งคำร้องมาที่{' '}
                    <a href="mailto:dmca@moviesai.com" className="text-amber-400 hover:underline font-bold">
                        dmca@moviesai.com
                    </a>{' '}
                    เราจะตรวจสอบและดำเนินการภายใน 7 วันทำการ
                </p>
            </section>

            <section className="space-y-2">
                <h2 className="text-base font-bold text-white">4. การตอบโต้การแจ้งโดยมิชอบ</h2>
                <p>
                    การแจ้งเท็จอาจทำให้ผู้แจ้งต้องรับผิดตามกฎหมาย เราขอสงวนสิทธิ์ในการระงับบัญชีที่ละเมิดซ้ำ
                </p>
            </section>
        </LegalPage>
    )
}
