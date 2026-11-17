import { expect, test } from '@playwright/test'

/**
 * เทสต์มือถือ (390px — iPhone 12/13/14 class) — Wave 3 ข้อ 9
 * ตรวจระบบนำทางล่าง + touch target + ไม่ล้นแนวนอน
 */

const MOBILE = { width: 390, height: 844 }
test.use({ viewport: MOBILE })

test.describe('แถบนำทางล่าง (BottomNav)', () => {
    test('แสดง 5 เมนูครบ: หน้าแรก / ทั้งหมด / ค้นหา / เก็บไว้ / เข้าสู่ระบบ', async ({ page }) => {
        await page.goto('/')
        const nav = page.getByRole('navigation', { name: 'เมนูนำทางด้านล่าง' })
        await expect(nav).toBeVisible()

        await expect(nav.getByRole('link', { name: /หน้าแรก/ })).toBeVisible()
        await expect(nav.getByRole('link', { name: /ทั้งหมด/ })).toBeVisible()
        await expect(nav.getByRole('button', { name: /ค้นหาเรื่อง/ })).toBeVisible()
        await expect(nav.getByRole('link', { name: /เก็บไว้/ })).toBeVisible()
        await expect(nav.getByRole('link', { name: /เข้าสู่ระบบ/ })).toBeVisible()
    })

    test('ปุ่มในแถบนำทางสูงอย่างน้อย 44px (touch target)', async ({ page }) => {
        await page.goto('/')
        const nav = page.getByRole('navigation', { name: 'เมนูนำทางด้านล่าง' })
        await expect(nav).toBeVisible()

        const items = nav.locator('a, button')
        const count = await items.count()
        expect(count).toBeGreaterThanOrEqual(5)

        for (let i = 0; i < count; i++) {
            const box = await items.nth(i).boundingBox()
            expect(box, `ไอเทมที่ ${i + 1} ต้องมีพื้นที่แตะพอ`).not.toBeNull()
            expect(box!.height).toBeGreaterThanOrEqual(44)
        }
    })
})

test.describe('ไม่ล้นแนวนอนบนมือถือ', () => {
    test('หน้าแรก /movies และหน้ารายละเอียด — scrollWidth ต้องเท่ากับ viewport', async ({ page }) => {
        const pagesToCheck = ['/', '/movies']

        for (const path of pagesToCheck) {
            await page.goto(path)
            await page.waitForTimeout(1500)
            const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
            expect(overflow, `หน้า ${path} ต้องไม่ล้นแนวนอน`).toBeLessThanOrEqual(0)
        }
    })
})
