import { defineConfig, devices } from '@playwright/test'

/**
 * E2E tests — รันกับ dev server พอร์ต 3002
 * ใช้: npx playwright test
 * (ถ้า dev server เปิดอยู่แล้ว จะ reuse โดยไม่สั่ง start ใหม่)
 */
export default defineConfig({
    testDir: './e2e',
    fullyParallel: false,
    workers: 1,
    timeout: 60_000,
    retries: 0,
    use: {
        baseURL: 'http://localhost:3002',
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: {
        command: 'npx next dev -p 3002',
        url: 'http://localhost:3002',
        reuseExistingServer: true,
        timeout: 120_000,
    },
})
