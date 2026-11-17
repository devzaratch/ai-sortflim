'use client'

import { useEffect, useState } from 'react'

/**
 * วันที่อัปเดตล่าสุด (เขตเวลาของเครื่องผู้ใช้) — ตั้งหลัง mount กัน hydration mismatch
 */
export default function UpdateDate() {
    const [formattedDate, setFormattedDate] = useState('')

    useEffect(() => {
        Promise.resolve().then(() => {
            setFormattedDate(
                new Date().toLocaleDateString('th-TH', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                })
            )
        })
    }, [])

    if (!formattedDate) return null
    return <>• อัปเดตล่าสุด {formattedDate}</>
}
