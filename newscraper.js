import { createClient } from '@supabase/supabase-js'
import puppeteer from 'puppeteer'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ไม่พบ NEXT_PUBLIC_SUPABASE_URL หรือ SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
})

const BASE_URL = 'https://xn--42c6de8aao8i7a.com/'
const REFRESH_MODE = (process.env.SCRAPE_REFRESH || 'expired').toLowerCase()
const EXPIRY_SAFETY_SECONDS = 60 * 60 // ใกล้หมดอายุภายใน 1 ชม. = รีเฟรช

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

async function scrapeAllMovies() {
    console.log('🚀 เริ่มต้นบอทกวาดและรีเฟรชลิงก์สตรีมมิ่งทุกเรื่องแบบอัตโนมัติ...')

    // 1. ดึงรายการหนังทั้งหมดจากตาราง movies
    const { data: movies, error: movieError } = await supabase.from('movies').select('*')

    if (movieError || !movies) {
        console.error('❌ ไม่สามารถดึงรายการหนังจาก Supabase ได้:', movieError)
        return
    }

    console.log(`📚 พบหนังทั้งหมดในระบบ ${movies.length} เรื่อง กำลังเริ่มประมวลผล...`)

    const browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()

    try {
        for (const movie of movies) {
            console.log(`\n========================================`)
            console.log(`🎬 กำลังประมวลผลเรื่อง: ${movie.title}`)
            console.log(`========================================`)

            // เจนลิงก์หน้าเว็บตอนที่ 1 อัตโนมัติจากชื่อหนังใน DB (มี /ep-1/ ต่อท้ายตามโครงสร้างจริง)
            const targetUrl = `${BASE_URL}${encodeURIComponent(movie.title)}/ep-1/`
            console.log(`🔗 Target URL: ${targetUrl}`)

            try {
                await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 })
            } catch (err) {
                console.log(`❌ เปิดหน้าเว็บของเรื่อง "${movie.title}" ไม่สำเร็จ (ข้ามไปเรื่องถัดไป)`)
                continue
            }

            // รอให้ container รายชื่อตอนโหลด
            try {
                await page.waitForSelector('div#api-episodes a', { timeout: 10000 })
            } catch (e) {
                console.log(`⚠️ ไม่พบพาร์ทรายการตอน (#api-episodes) ในเรื่องนี้ ข้าม...`)
                continue
            }

            // ดึงรายชื่อตอนทั้งหมดจากหน้าเว็บ
            const episodeUrls = await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('div#api-episodes a'))
                return links.map((link, index) => ({
                    episode_number: index + 1,
                    title: link.getAttribute('title') || `ตอนที่ ${index + 1}`,
                    url: link.href,
                }))
            })

            console.log(`📦 พบทั้งหมดบนเว็บ ${episodeUrls.length} ตอน`)

            // ดึงข้อมูลตอนที่มีอยู่แล้วใน Supabase ของเรื่องนี้
            const { data: existingEpisodes } = await supabase
                .from('episodes')
                .select('id, episode_number, stream_path, origin_url')
                .eq('movie_id', movie.id)

            const existingByNumber = new Map(existingEpisodes?.map((ep) => [ep.episode_number, ep]) || [])

            for (const ep of episodeUrls) {
                const existing = existingByNumber.get(ep.episode_number)
                const expired = existing ? isLinkExpired(existing.stream_path) : false
                const shouldRefresh = !existing || REFRESH_MODE === 'all' || (REFRESH_MODE === 'expired' && (expired || !existing.stream_path))

                if (existing && existing.origin_url && !shouldRefresh) {
                    continue
                }

                try {
                    await page.goto(ep.url, { waitUntil: 'networkidle2', timeout: 20000 })

                    let videoSrc = null
                    let retries = 5

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
                        if (existing) {
                            await supabase
                                .from('episodes')
                                .update({
                                    stream_path: videoSrc,
                                    origin_url: ep.url
                                })
                                .eq('id', existing.id)
                            console.log(`♻️ อัปเดตลิงก์ตอนที่ ${ep.episode_number} สำเร็จ`)
                        } else {
                            await supabase.from('episodes').insert({
                                movie_id: movie.id,
                                episode_number: ep.episode_number,
                                title: ep.title,
                                stream_path: videoSrc,
                                origin_url: ep.url,
                                access_level: ep.episode_number <= 35 ? 'free' : 'early_access',
                                is_published: true,
                            })
                            console.log(`✅ เพิ่มตอนใหม่สำเร็จ: ${ep.title}`)
                        }
                    } else {
                        console.log(`⚠️ ไม่พบลิงก์วิดีโอในตอนที่ ${ep.episode_number}`)
                    }
                } catch (err) {
                    console.log(`❌ พลาดตอนที่ ${ep.episode_number}: ${err.message}`)
                }
            }
        }
    } catch (err) {
        console.error('❌ เกิดข้อผิดพลาดภาพรวม:', err)
    } finally {
        await browser.close()
        console.log('\n✨ จบรอบการทำงานของบอทกวาดข้อมูลทุกเรื่องเรียบร้อย!')
    }
}

scrapeAllMovies()