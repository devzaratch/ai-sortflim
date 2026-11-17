/**
 * สร้างไอคอน PWA จากโลโก้แบรนด์ MOVIES AI (รันด้วย: node scripts/generate-icons.mjs)
 * - พื้นหลัง #0b0b0d เต็มขอบ (maskable-safe: เนื้อหาอยู่กลาง 80% กลาง)
 * - ผลลัพธ์: public/icons/icon-192.png, icon-512.png, apple-touch-icon.png (180)
 */
import { mkdir, writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const BG = '#0b0b0d'

/** โลโก้แถบฟิล์มแนวตั้ง + ปุ่มเล่น + ประกาย AI (จาก app/icon.svg) วางกลางด้วย safe zone 80% */
const SOURCE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="amberGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FCD34D"/>
      <stop offset="0.55" stop-color="#F59E0B"/>
      <stop offset="1" stop-color="#D97706"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" fill="${BG}"/>
  <g transform="translate(6.4 6.4) scale(0.8)">
    <rect x="18" y="10" width="28" height="44" rx="7" fill="url(#amberGrad)"/>
    <g fill="#1c1917" opacity="0.92">
      <rect x="21.5" y="14" width="4" height="3.5" rx="1.6"/>
      <rect x="38.5" y="14" width="4" height="3.5" rx="1.6"/>
      <rect x="21.5" y="46.5" width="4" height="3.5" rx="1.6"/>
      <rect x="38.5" y="46.5" width="4" height="3.5" rx="1.6"/>
    </g>
    <path d="M27.5 26 L41.5 33.5 L27.5 41 Z" fill="#1c1917" stroke="#1c1917" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M52 5.5 L53.5 8.5 L56.5 10 L53.5 11.5 L52 14.5 L50.5 11.5 L47.5 10 L50.5 8.5 Z" fill="#FDE68A"/>
  </g>
</svg>`

async function main() {
  await mkdir('public/icons', { recursive: true })
  const svg = Buffer.from(SOURCE)

  await writeFile('public/icons/icon-source.svg', SOURCE)

  for (const size of [192, 512]) {
    await sharp(svg, { density: 300 })
      .resize(size, size)
      .png()
      .toFile(`public/icons/icon-${size}.png`)
    console.log(`icon-${size}.png ok`)
  }

  // iOS: 180x180 ต้องเป็นภาพทึบ (ไม่โปร่งใส) — iOS จะตัดมุมเอง
  await sharp(svg, { density: 300 })
    .resize(180, 180)
    .png()
    .toFile('public/icons/apple-touch-icon.png')
  console.log('apple-touch-icon.png ok')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
