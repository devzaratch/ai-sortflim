import Link from 'next/link'
import Footer from '@/components/Footer'

interface LegalPageProps {
    title: string
    updatedAt?: string
    children: React.ReactNode
}

/** โครงหน้านิ่ง (นโยบาย/ข้อตกลง) ให้หน้าตาเหมือนกันทุกหน้า */
export default function LegalPage({ title, updatedAt, children }: LegalPageProps) {
    return (
        <div className="min-h-screen bg-[#0b0b0d] text-white font-sans flex flex-col justify-between">
            <div>
                <header className="sticky top-0 z-50 bg-[#0b0b0d]/90 backdrop-blur-xl border-b border-zinc-800/60 px-4 lg:px-12 py-3.5">
                    <Link href="/" className="text-2xl font-black tracking-tighter text-white inline-flex items-center gap-1.5">
                        <span className="bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">MOVIES</span>
                        <span className="bg-amber-500 text-zinc-950 px-2 py-0.5 rounded-lg text-xs font-black tracking-normal shadow-lg shadow-amber-500/20">AI</span>
                    </Link>
                </header>

                <main className="max-w-3xl mx-auto px-4 lg:px-8 py-10 space-y-6">
                    <div className="space-y-2 border-b border-zinc-800/80 pb-5">
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight">{title}</h1>
                        {updatedAt && <p className="text-xs text-zinc-500">ปรับปรุงล่าสุด: {updatedAt}</p>}
                    </div>

                    <div className="space-y-5 text-sm text-zinc-300 leading-relaxed">{children}</div>

                    <div className="pt-6 border-t border-zinc-800/80">
                        <Link href="/" className="text-xs text-amber-400 hover:underline font-bold">
                            ← กลับหน้าแรก
                        </Link>
                    </div>
                </main>
            </div>
            <Footer />
        </div>
    )
}
