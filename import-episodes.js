import { createClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// ต้องรันด้วย `npm run import:episodes` (โหลด .env.local ผ่าน --env-file)
// ---------------------------------------------------------------------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ไม่พบ NEXT_PUBLIC_SUPABASE_URL หรือ key ใน .env.local')
    console.error('   รันด้วย `npm run import:episodes` อีกครั้ง')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
})

// 1. ระบุ ID ของหนัง (movieId) ที่ต้องการเพิ่มตอน (ตั้งผ่าน env ได้)
const MOVIE_ID = process.env.IMPORT_MOVIE_ID || '9700caa5-c109-40f5-9f18-ff67c236954a'

// 2. ใส่รายการวิดีโอ (Direct URL / Streamable / Vimeo Link) ทั้งหมดที่ต้องการนำเข้า
const rawEpisodesData = [
    { ep: 1, url: 'https://hwztakavideoto.dramaboxdb.com/29fb91e1f603360aa7977c7d70ed0a55/6ae1837f/31/9x0/90x2/902x8/90282000024/701724013_1/701724013.720p.narrowv3.mp4', level: 'free' },
    { ep: 2, url: 'https://hwztakavideoto.dramaboxdb.com/9394c2d6269fb7dbbebb7085fdb1fea1/6ae30013/41/9x0/90x2/902x8/90282000024/701724014_1/701724014.720p.narrowv3.mp4', level: 'free' },
    { ep: 3, url: 'https://hwztakavideoto.dramaboxdb.com/e3075ddac77643cc1199cb3999147177/6ae30013/51/9x0/90x2/902x8/90282000024/701724015_1/701724015.720p.narrowv3.mp4', level: 'free' },
    { ep: 4, url: 'https://hwztakavideoto.dramaboxdb.com/91d35bd87c29db25e23142b8ab741f34/6ae30013/61/9x0/90x2/902x8/90282000024/701724016_1/701724016.720p.narrowv3.mp4', level: 'early_access' },
    { ep: 5, url: 'https://hwztakavideoto.dramaboxdb.com/acb68466638427b73e139d5a8b8c0e04/6ae30013/71/9x0/90x2/902x8/90282000024/701724017_1/701724017.720p.narrowv3.mp4', level: 'early_access' },
]

async function bulkImport() {
    console.log('กำลังนำเข้าข้อมูลตอน...')

    const formattedData = rawEpisodesData.map((item) => ({
        movie_id: MOVIE_ID,
        episode_number: item.ep,
        title: `ตอนที่ ${item.ep}`,
        stream_path: item.url,
        access_level: item.level,
        is_published: true,
    }))

    const { error } = await supabase.from('episodes').insert(formattedData)

    if (error) {
        console.error('เกิดข้อผิดพลาดในการนำเข้า:', error)
    } else {
        console.log(`นำเข้าสำเร็จเรียบร้อย ${rawEpisodesData.length} ตอน!`)
    }
}

bulkImport()
