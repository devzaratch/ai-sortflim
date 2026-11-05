import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'ละคร AI ทั้งหมด',
    description: 'รวมละครสั้น AI และซีรีส์ AI แนวตั้งทุกแนว ทั้งดราม่า โรแมนติก ย้อนยุค วาย แฟนตาซี พร้อมตัวกรองหมวดหมู่และเรื่องที่จบแล้ว',
    alternates: { canonical: '/movies' },
}

export default function MoviesLayout({ children }: LayoutProps<'/movies'>) {
    return children
}
