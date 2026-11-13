// สคริปต์ช่วย: แปลง app/icon.svg → favicon.ico (PNG-in-ICO)
// ใช้: node scripts/make-favicon.mjs
import { writeFileSync } from 'node:fs'
import sharp from 'sharp'


const svgPath = 'app/icon.svg'
const icoPath = 'app/favicon.ico'

const png = await sharp(svgPath, { density: 300 })
    .resize(256, 256)
    .png()
    .toBuffer()

// โครงสร้าง ICO: header 6 bytes + dir entry 16 bytes + PNG data
const header = Buffer.alloc(6)
header.writeUInt16LE(0, 0) // reserved
header.writeUInt16LE(1, 2) // type: icon
header.writeUInt16LE(1, 4) // 1 image

const entry = Buffer.alloc(16)
entry.writeUInt8(0, 0) // width 0 = 256
entry.writeUInt8(0, 1) // height 0 = 256
entry.writeUInt8(0, 2) // palette
entry.writeUInt8(0, 3) // reserved
entry.writeUInt16LE(1, 4) // planes
entry.writeUInt16LE(32, 6) // bpp
entry.writeUInt32LE(png.length, 8) // data size
entry.writeUInt32LE(22, 12) // offset

writeFileSync(icoPath, Buffer.concat([header, entry, png]))
console.log('favicon.ico written:', png.length, 'bytes png')
