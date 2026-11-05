export default function Loading() {
    return (
        <div className="min-h-screen bg-[#0b0b0d] text-white flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-orange-500 animate-spin" />
                <p className="text-xs text-zinc-400 animate-pulse">กำลังโหลด...</p>
            </div>
        </div>
    )
}
