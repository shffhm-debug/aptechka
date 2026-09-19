// Генерация иконок PWA из одного SVG: node scripts/icons.mjs
import sharp from 'sharp'
import { writeFileSync } from 'node:fs'

const svg = ({ rx = 112, pad = 0, bg = '#0E8A6D' } = {}) => {
  // pad — доля отступа для maskable (безопасная зона ~ 80%)
  const s = 1 - pad * 2
  const cx = 256
  const arm = 256 * s   // длина креста
  const th = 80 * s     // толщина
  const r = 28 * s
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${rx}" fill="${bg}"/>
  <rect x="${cx - th / 2}" y="${cx - arm / 2}" width="${th}" height="${arm}" rx="${r}" fill="#fff"/>
  <rect x="${cx - arm / 2}" y="${cx - th / 2}" width="${arm}" height="${th}" rx="${r}" fill="#fff"/>
</svg>`)
}

writeFileSync('public/favicon.svg', svg({ rx: 112 }))
await sharp(svg({ rx: 112 })).resize(192).png().toFile('public/pwa-192.png')
await sharp(svg({ rx: 112 })).resize(512).png().toFile('public/pwa-512.png')
await sharp(svg({ rx: 0, pad: 0.12 })).resize(512).png().toFile('public/pwa-maskable-512.png')
await sharp(svg({ rx: 0 })).resize(180).png().toFile('public/apple-touch-icon.png')
console.log('icons ok')
