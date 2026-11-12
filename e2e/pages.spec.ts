import { expect, test } from '@playwright/test'

/**
 * E2E หลักของเว็บ — ทดสอบหน้าสำคัญบนข้อมูลจริงใน Supabase
 * เรื่องทดสอบ: "ปรารถนาอัลฟ่าต้องห้าม" (มี 58 ตอน)
 */

const TEST_TITLE = 'ปรารถนาอัลฟ่าต้องห้าม'
const TEST_TITLE_URL = `/title/${encodeURIComponent(TEST_TITLE)}`

test.describe('หน้าแรก', () => {
    test('โหลดหน้าแรกได้ มีแถบ Top 10 และการ์ดเรื่อง', async ({ page }) => {
        await page.goto('/')
        await expect(page).toHaveTitle(/ละคร AI|ซีรีส์ AI/)

        // ส่วนยอดนิยม Top 10
        await expect(page.getByText('ยอดนิยม Top 10')).toBeVisible()

        // การ์ดเรื่อง (ลิงก์ไปหน้า /title/...)
        const cards = page.locator('a[href^="/title/"]')
        await expect(cards.first()).toBeVisible()
    })
})

test.describe('หน้ารายการ + ค้นหา', () => {
    test('/movies แสดงการ์ดเรื่องอย่างน้อย 1 เรื่อง', async ({ page }) => {
        await page.goto('/movies')
        await expect(page.locator('a[href^="/title/"]').first()).toBeVisible()
    })

    test('ค้นหาด้วยชื่อเรื่องทดสอบ เจอเรื่องนั้น', async ({ page }) => {
        await page.goto(`/movies?search=${encodeURIComponent(TEST_TITLE)}`)
        await expect(page.getByText(TEST_TITLE).first()).toBeVisible()
    })
})

test.describe('หน้ารายละเอียดแบบ slug', () => {
    test(`/title/<ชื่อเรื่อง> มี H1 ชื่อเรื่อง + รายการตอน`, async ({ page }) => {
        await page.goto(TEST_TITLE_URL)

        const h1 = page.locator('h1')
        await expect(h1).toContainText(TEST_TITLE)

        // มีปุ่ม/การ์ดตอน (EP.)
        await expect(page.getByText(/EP\.\d+/).first()).toBeVisible()
    })

    test('slug ที่ไม่ตรงชื่อเรื่อง แสดงหน้า 404', async ({ page }) => {
        // PPR: shell ตอบ 200 แล้วสตรีม UI not-found ตามมา — เช็คที่เนื้อหาแทน status
        await page.goto('/title/ชื่อเรื่องไม่มีจริง-xyz')
        await expect(page.getByText('ไม่พบหน้าที่คุณต้องการ')).toBeVisible({ timeout: 30_000 })
    })
})
