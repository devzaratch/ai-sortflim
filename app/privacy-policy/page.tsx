import type { Metadata } from 'next'
import LegalPage from '@/components/LegalPage'

export const metadata: Metadata = {
    title: 'นโยบายความเป็นส่วนตัว',
    description: 'นโยบายความเป็นส่วนตัวของ MOVIES AI การเก็บ ใช้ และคุ้มครองข้อมูลผู้ใช้',
}

export default function PrivacyPolicyPage() {
    return (
        <LegalPage title="นโยบายความเป็นส่วนตัว" updatedAt="1 พฤศจิกายน 2026">
            <section className="space-y-2">
                <h2 className="text-base font-bold text-white">1. ข้อมูลที่เราเก็บ</h2>
                <p>
                    เมื่อคุณสมัครสมาชิก เราเก็บอีเมล ชื่อผู้ใช้ และรหัสผ่านที่เข้ารหัสแล้วผ่านระบบ Supabase Auth
                    รวมถึงประวัติการรับชม (เรื่อง ตอน และเวลาที่ดูล่าสุด) เพื่อให้ฟีเจอร์ “ดูต่อจากที่ค้างไว้” ทำงานได้
                </p>
            </section>

            <section className="space-y-2">
                <h2 className="text-base font-bold text-white">2. วัตถุประสงค์ในการใช้ข้อมูล</h2>
                <ul className="list-disc pl-5 space-y-1">
                    <li>ยืนยันตัวตนและรักษาความปลอดภัยของบัญชี</li>
                    <li>แสดงความคืบหน้าการรับชมและแนะนำเนื้อหาที่เกี่ยวข้อง</li>
                    <li>ปรับปรุงคุณภาพของบริการและแก้ไขข้อผิดพลาด</li>
                </ul>
            </section>

            <section className="space-y-2">
                <h2 className="text-base font-bold text-white">3. การเปิดเผยข้อมูลต่อบุคคลที่สาม</h2>
                <p>
                    เราไม่ขายข้อมูลส่วนบุคคลของคุณ ผู้ให้บริการโครงสร้างพื้นฐาน (เช่น Supabase) อาจเข้าถึงข้อมูลเท่าที่จำเป็น
                    ต่อการให้บริการตามข้อตกลงการประมวลผลข้อมูล
                </p>
            </section>

            <section className="space-y-2">
                <h2 className="text-base font-bold text-white">4. สิทธิของเจ้าของข้อมูล</h2>
                <p>
                    คุณสามารถขอลบประวัติการรับชมได้จากปุ่ม “ล้างประวัติการดู” ในหน้าแรก และขอลบบัญชีได้โดยติดต่อ
                    support@moviesai.com ตามสิทธิภายใต้ PDPA
                </p>
            </section>

            <p className="text-xs text-zinc-500">
                หมายเหตุ: หน้านี้เป็นข้อความตัวอย่างสำหรับการพัฒนาเว็บ ควรให้ฝ่ายกฎหมายตรวจสอบก่อนใช้งานจริง
            </p>
        </LegalPage>
    )
}
