import { createClient } from '@supabase/supabase-js'
import puppeteer from 'puppeteer'

// ---------------------------------------------------------------------------
// ต้องรันด้วย `npm run scrape` (จะโหลด .env.local ให้อัตโนมัติผ่าน --env-file)
// ห้าม hardcode key ลงไฟล์นี้ เพราะ service_role key ข้าม RLS ได้ทั้งหมด
//
// โหมดการทำงาน (ตั้งผ่าน env):
//   SCRAPE_REFRESH=false   → เพิ่มเฉพาะตอนใหม่ (ค่าเริ่มต้นเดิม)
//   SCRAPE_REFRESH=expired → เพิ่มตอนใหม่ + ดึงลิงก์ใหม่เฉพาะตอนที่ลิงก์หมดอายุ (ค่าเริ่มต้น)
//   SCRAPE_REFRESH=all     → ดึงลิงก์วิดีโอใหม่ทุกตอน
//   SCRAPE_LIMIT=5         → จำกัดจำนวนตอนที่จะดึง (ไว้ทดสอบ)
// ---------------------------------------------------------------------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ไม่พบ NEXT_PUBLIC_SUPABASE_URL หรือ SUPABASE_SERVICE_ROLE_KEY')
    console.error('   ตรวจสอบไฟล์ .env.local แล้วรันด้วย `npm run scrape` อีกครั้ง')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
})

// ตั้งค่าผ่าน env ได้ เช่น SCRAPE_MOVIE_ID=... npm run scrape
const MOVIE_ID = process.env.SCRAPE_MOVIE_ID || '7f26777b-4a6b-4e15-b7a6-9000b04930cb'

// ใส่ลิงก์หน้าดูหนังตอนที่ 1 หรือหน้าหลักที่มีรายชื่อตอนครบ
const TARGET_URL =
    process.env.SCRAPE_TARGET_URL ||
    'https://xn--42c6de8aao8i7a.com/%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B9%80%E0%B8%AD%E0%B8%B2%E0%B8%84%E0%B8%B7%E0%B8%99%E0%B8%82%E0%B8%AD%E0%B8%87%E0%B8%99%E0%B9%89%E0%B8%AD%E0%B8%87%E0%B8%AA%E0%B8%B2%E0%B8%A7%E0%B8%A1%E0%B8%AB%E0%B8%B2%E0%B9%80%E0%B8%A8%E0%B8%A3%E0%B8%A9%E0%B8%90%E0%B8%B5/ep-1/'

// จำนวนตอนฟรีเริ่มต้น (ตอนที่มากกว่านี้จะถูกตั้งเป็น early_access สำหรับ VIP)
const FREE_EPISODE_LIMIT = Number(process.env.SCRAPE_FREE_EPISODES || 40)

// false | expired | all
const REFRESH_MODE = (process.env.SCRAPE_REFRESH || 'expired').toLowerCase()

// จำกัดจำนวนตอนต่อรอบ (0 = ไม่จำกัด) ใช้ตอนทดสอบเพื่อไม่ให้รอนาน
const SCRAPE_LIMIT = Number(process.env.SCRAPE_LIMIT || 0)

// ลิงก์วิดีโอของต้นทางเป็น signed URL ที่มีวันหมดอายุฝังมา
// - CloudFront: ...?Expires=1793246400&Signature=...
// - dramabox:  .../6ae41f22/...  (hex ของ unix timestamp)
// ถ้าลิงก์หมดอายุ เซิร์ฟเวอร์จะตอบ 403 ทำให้ player เป็นจอดำ
const EXPIRY_SAFETY_SECONDS = 60 * 60 // ถือว่าใกล้หมดอายุภายใน 1 ชม. = ต้องรีเฟรช

function isLinkExpired(url) {
    if (!url) return true

    const now = Math.floor(Date.now() / 1000)

    const cloudfront = url.match(/Expires=(\d+)/)
    if (cloudfront) {
        return Number(cloudfront[1]) - EXPIRY_SAFETY_SECONDS < now
    }

    if (url.includes('dramaboxdb.com')) {
        const token = url.match(/\/([0-9a-f]{8})\//)
        if (token) {
            return parseInt(token[1], 16) - EXPIRY_SAFETY_SECONDS < now
        }
    }

    return false
}

async function scrapeAllEpisodes() {
    console.log('🚀 เริ่มต้นเปิด Browser เพื่อกวาดข้อมูลทุกตอน...')
    console.log(`⚙️  โหมดรีเฟรชลิงก์: ${REFRESH_MODE}`)

    // 1. ดึงรายการตอนที่มีอยู่แล้วในฐานข้อมูล Supabase มาเช็คก่อน
    console.log('🔍 กำลังตรวจสอบตอนที่มีอยู่แล้วในฐานข้อมูล...')
    const { data: existingEpisodes, error: fetchError } = await supabase
        .from('episodes')
        .select('id, episode_number, stream_path')
        .eq('movie_id', MOVIE_ID)

    if (fetchError) {
        console.error('❌ ไม่สามารถดึงข้อมูลตอนที่มีอยู่จาก Supabase ได้:', fetchError)
        return
    }

    const existingByNumber = new Map(existingEpisodes.map((ep) => [ep.episode_number, ep]))
    console.log(`📌 ในฐานข้อมูลตอนนี้มีอยู่แล้วทั้งหมด ${existingByNumber.size} ตอน`)

    const browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()

    try {
        await page.goto(TARGET_URL, { waitUntil: 'networkidle2' })
        console.log('🔗 เข้าสู่หน้าเว็บสำเร็จ กำลังดึงรายชื่อตอนจาก #api-episodes...')

        await page.waitForSelector('div#api-episodes a', { timeout: 15000 })

        // ดึง URL ของแต่ละตอนทั้งหมดจาก container ที่ระบุ
        const episodeUrls = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('div#api-episodes a'))
            return links.map((link, index) => ({
                episode_number: index + 1,
                title: link.getAttribute('title') || `ตอนที่ ${index + 1}`,
                url: link.href,
            }))
        })

        console.log(`📦 พบทั้งหมดบนเว็บ ${episodeUrls.length} ตอน`)

        const toInsert = []
        const toUpdate = []
        let scrapedCount = 0

        for (const ep of episodeUrls) {
            const existing = existingByNumber.get(ep.episode_number)
            const expired = existing ? isLinkExpired(existing.stream_path) : false
            const shouldRefresh = existing && (REFRESH_MODE === 'all' || (REFRESH_MODE === 'expired' && expired))

            if (existing && !shouldRefresh) {
                console.log(`⏭️ ตอนที่ ${ep.episode_number} มีลิงก์ที่ยังใช้ได้ ข้ามไป...`)
                continue
            }

            if (SCRAPE_LIMIT > 0 && scrapedCount >= SCRAPE_LIMIT) {
                console.log(`🛑 ถึงขีดจำกัด SCRAPE_LIMIT=${SCRAPE_LIMIT} แล้ว หยุดดึงเพิ่ม`)
                break
            }

            try {
                await page.goto(ep.url, { waitUntil: 'networkidle2' })

                let videoSrc = null
                let retries = 10

                while (retries > 0) {
                    videoSrc = await page.evaluate(() => {
                        const video = document.querySelector('video#api-video')
                        return video ? video.src : null
                    })

                    if (videoSrc && videoSrc.startsWith('http')) break

                    await new Promise((resolve) => setTimeout(resolve, 1000))
                    retries--
                }

                if (videoSrc) {
                    scrapedCount++
                    if (existing) {
                        toUpdate.push({ id: existing.id, episode_number: ep.episode_number, stream_path: videoSrc })
                        console.log(`♻️ รีเฟรชลิงก์ตอนที่ ${ep.episode_number} สำเร็จ`)
                    } else {
                        toInsert.push({
                            movie_id: MOVIE_ID,
                            episode_number: ep.episode_number,
                            title: ep.title,
                            stream_path: videoSrc,
                            access_level: ep.episode_number <= FREE_EPISODE_LIMIT ? 'free' : 'early_access',
                            is_published: true,
                        })
                        console.log(`✅ ดึงตอนใหม่สำเร็จ: ${ep.title}`)
                    }
                } else {
                    console.log(`⚠️ ไม่พบลิงก์วิดีโอใน ${ep.title} (หมดเวลาตารอ)`)
                }
            } catch (err) {
                console.log(`❌ พลาดตอนที่ ${ep.episode_number}: ${err.message}`)
            }
        }

        if (toInsert.length === 0 && toUpdate.length === 0) {
            console.log('✨ ไม่มีตอนใหม่และไม่มีลิงก์หมดอายุให้แก้ ทุกอย่างเรียบร้อย!')
            return
        }

        // 2. เพิ่มตอนใหม่
        if (toInsert.length > 0) {
            console.log(`💾 กำลังบันทึกตอนใหม่ ${toInsert.length} ตอน ลง Supabase...`)
            const { error } = await supabase.from('episodes').insert(toInsert)
            if (error) {
                console.error('❌ บันทึกตอนใหม่ลง Supabase ไม่สำเร็จ:', error)
            } else {
                console.log(`🎉 เพิ่มตอนใหม่สำเร็จเรียบร้อย ${toInsert.length} ตอน!`)
            }
        }

        // 3. อัปเดตลิงก์ที่หมดอายุ (อัปเดตทีละแถวด้วย id เพื่อไม่ต้องพึ่ง unique constraint)
        if (toUpdate.length > 0) {
            console.log(`🔧 กำลังอัปเดตลิงก์วิดีโอ ${toUpdate.length} ตอน...`)
            let updated = 0
            for (const item of toUpdate) {
                const { error } = await supabase
                    .from('episodes')
                    .update({ stream_path: item.stream_path })
                    .eq('id', item.id)

                if (error) {
                    console.error(`❌ อัปเดตตอนที่ ${item.episode_number} ไม่สำเร็จ:`, error.message)
                } else {
                    updated++
                }
            }
            console.log(`✅ อัปเดตลิงก์วิดีโอสำเร็จ ${updated}/${toUpdate.length} ตอน`)
        }
    } catch (err) {
        console.error('❌ เกิดข้อผิดพลาดภาพรวม:', err)
    } finally {
        await browser.close()
    }
}

scrapeAllEpisodes()
