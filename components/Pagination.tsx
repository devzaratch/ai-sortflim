import Link from 'next/link'

/**
 * ตัวแบ่งหน้าแบบลิงก์ (ทำงานได้แม้ไม่มี JS) — คงค่ากรองอื่นใน URL
 */
export default function Pagination({
    page,
    totalPages,
    buildHref,
}: {
    page: number
    totalPages: number
    /** ฟังก์ชันสร้าง href ของหน้า n (คงค่ากรองใน URL) */
    buildHref: (n: number) => string
}) {
    if (totalPages <= 1) return null

    const item = (n: number | null, label: string, active = false, disabled = false) => {
        if (disabled || n === null) {
            return (
                <span
                    aria-disabled="true"
                    className="min-h-11 min-w-11 flex items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.06] text-zinc-600 font-bold text-xs cursor-not-allowed"
                >
                    {label}
                </span>
            )
        }
        return (
            <Link
                href={buildHref(n)}
                aria-current={active ? 'page' : undefined}
                aria-label={label}
                className={`min-h-11 min-w-11 flex items-center justify-center rounded-xl font-bold text-xs transition active:scale-95 ${
                    active
                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                        : 'bg-white/[0.04] border border-white/[0.06] text-zinc-300 hover:bg-white/[0.08] hover:text-white'
                }`}
            >
                {label}
            </Link>
        )
    }

    // หน้าเลขตรงกลาง: แสดงหน้าปัจจุบัน ±1
    const pages: number[] = []
    for (let n = Math.max(1, page - 1); n <= Math.min(totalPages, page + 1); n++) {
        pages.push(n)
    }

    return (
        <nav aria-label="แบ่งหน้ารายการ" className="flex items-center justify-center gap-2 pt-2">
            {item(page - 1, 'ก่อนหน้า', false, page <= 1)}
            {pages[0] > 1 && <span className="text-zinc-600 text-xs px-1">…</span>}
            {pages.map((n) => item(n, String(n), n === page))}
            {pages[pages.length - 1] < totalPages && <span className="text-zinc-600 text-xs px-1">…</span>}
            {item(page + 1, 'ถัดไป', false, page >= totalPages)}
        </nav>
    )
}
