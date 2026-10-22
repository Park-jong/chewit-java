// PWA 아이콘 PNG 생성기 (외부 의존성 없이 node 내장 zlib만 사용).
// 사용: node scripts/generate-icons.mjs  -> public/icons/*.png
// 디자인: 어두운 단색 배경(#171717) + 흰색 링에 오른쪽이 열린 "C" 형태.
// 도형은 중앙 반지름 40% 안(maskable 안전 영역)에 들어간다.
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const BG = [0x17, 0x17, 0x17]
const FG = [0xff, 0xff, 0xff]
const OUTER = 0.3 // 링 바깥 반지름 (이미지 크기 대비)
const INNER = 0.19 // 링 안쪽 반지름
const GAP_HALF_ANGLE = (38 * Math.PI) / 180 // 오른쪽 트임 반각
const SS = 3 // 슈퍼샘플링 (안티앨리어싱)

function coverage(x, y, size) {
  const cx = size / 2
  const cy = size / 2
  const dx = x - cx
  const dy = y - cy
  const r = Math.hypot(dx, dy) / size
  if (r > OUTER || r < INNER) return 0
  if (Math.abs(Math.atan2(dy, dx)) < GAP_HALF_ANGLE) return 0
  return 1
}

function render(size) {
  const raw = Buffer.alloc(size * (size * 3 + 1))
  let o = 0
  for (let y = 0; y < size; y++) {
    raw[o++] = 0 // filter: none
    for (let x = 0; x < size; x++) {
      let hit = 0
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          hit += coverage(x + (sx + 0.5) / SS, y + (sy + 0.5) / SS, size)
        }
      }
      const t = hit / (SS * SS)
      for (let c = 0; c < 3; c++) raw[o++] = Math.round(BG[c] + (FG[c] - BG[c]) * t)
    }
  }
  return raw
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function png(size) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // color type: RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(render(size), { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const outDir = path.resolve(import.meta.dirname, '../public/icons')
mkdirSync(outDir, { recursive: true })
const targets = {
  'icon-192.png': 192,
  'icon-512.png': 512,
  'icon-maskable-512.png': 512,
  'apple-touch-icon.png': 180,
}
for (const [name, size] of Object.entries(targets)) {
  writeFileSync(path.join(outDir, name), png(size))
  console.log(`wrote ${name} (${size}x${size})`)
}
