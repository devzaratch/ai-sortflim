/**
 * โลโก้แบรนด์ MOVIES AI — แถบฟิล์มแนวตั้ง (9:16) + ปุ่มเล่น + ประกาย AI
 * ไฟล์ SVG หลัก: public/brand/logo-icon.svg, public/brand/logo-horizontal.svg
 */
export default function LogoIcon({ className = 'w-9 h-9' }: { className?: string }) {
    return (
        <svg viewBox="0 0 64 64" className={className} role="img" aria-label="MOVIES AI">
            <defs>
                <linearGradient id="logoAmberGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#FCD34D" />
                    <stop offset="0.55" stopColor="#F59E0B" />
                    <stop offset="1" stopColor="#D97706" />
                </linearGradient>
            </defs>
            {/* จอแนวตั้งในรูปแถบฟิล์ม */}
            <rect x="18" y="8" width="28" height="48" rx="7" fill="url(#logoAmberGrad)" />
            {/* รูเฟิล์มฟิล์ม */}
            <g fill="#1c1917" opacity="0.92">
                <rect x="21.5" y="12.5" width="4" height="3.5" rx="1.6" />
                <rect x="38.5" y="12.5" width="4" height="3.5" rx="1.6" />
                <rect x="21.5" y="48" width="4" height="3.5" rx="1.6" />
                <rect x="38.5" y="48" width="4" height="3.5" rx="1.6" />
            </g>
            {/* ปุ่มเล่น */}
            <path
                d="M27.5 24.5 L41.5 32 L27.5 39.5 Z"
                fill="#1c1917"
                stroke="#1c1917"
                strokeWidth="2.5"
                strokeLinejoin="round"
            />
            {/* ประกาย AI */}
            <path d="M52 3.5 L53.5 6.5 L56.5 8 L53.5 9.5 L52 12.5 L50.5 9.5 L47.5 8 L50.5 6.5 Z" fill="#FDE68A" />
        </svg>
    )
}
