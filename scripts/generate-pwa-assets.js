import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const publicDir = path.join(__dirname, '..', 'public')
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true })

function crc32(buf) {
  let crc = 0xffffffff
  for (const b of buf) {
    crc ^= b
    for (let k = 0; k < 8; k += 1) {
      crc = (crc >>> 1) ^ ((crc & 1) * 0xedb88320)
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crc])
}

function writePng(filename, width, height) {
  const header = Buffer.from('\x89PNG\r\n\x1a\n', 'binary')
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0
  const pixels = Buffer.alloc(width * height * 3, 255)
  const scanlines = Buffer.concat(
    Array.from({ length: height }, (_, y) => Buffer.concat([Buffer.from([0]), pixels.slice(y * width * 3, (y + 1) * width * 3)]))
  )
  const idat = zlib.deflateSync(scanlines)
  const png = Buffer.concat([header, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
  fs.writeFileSync(path.join(publicDir, filename), png)
}

function writeIco(filename, width, height) {
  const pixels = Buffer.alloc(width * height * 3, 255)
  const rowSize = Math.ceil((width * 24) / 32) * 4
  const bmpHeader = Buffer.alloc(40)
  bmpHeader.writeUInt32LE(40, 0)
  bmpHeader.writeInt32LE(width, 4)
  bmpHeader.writeInt32LE(height * 2, 8)
  bmpHeader.writeUInt16LE(1, 12)
  bmpHeader.writeUInt16LE(24, 14)
  bmpHeader.writeUInt32LE(0, 16)
  bmpHeader.writeUInt32LE(rowSize * height, 20)
  const bmpData = Buffer.concat(
    [bmpHeader].concat(
      Array.from({ length: height }, (_, y) => {
        const row = pixels.slice((height - 1 - y) * width * 3, (height - y) * width * 3)
        const padded = Buffer.concat([row, Buffer.alloc(rowSize - row.length, 0)])
        return padded
      })
    )
  )
  const iconHeader = Buffer.alloc(6)
  iconHeader.writeUInt16LE(0, 0)
  iconHeader.writeUInt16LE(1, 2)
  iconHeader.writeUInt16LE(1, 4)
  const dirEntry = Buffer.alloc(16)
  dirEntry[0] = width < 256 ? width : 0
  dirEntry[1] = height < 256 ? height : 0
  dirEntry[2] = 0
  dirEntry[3] = 0
  dirEntry.writeUInt16LE(1, 4)
  dirEntry.writeUInt16LE(24, 6)
  dirEntry.writeUInt32LE(bmpData.length, 8)
  dirEntry.writeUInt32LE(6 + 16, 12)
  fs.writeFileSync(path.join(publicDir, filename), Buffer.concat([iconHeader, dirEntry, bmpData]))
}

writePng('pwa-192x192.png', 192, 192)
writePng('pwa-512x512.png', 512, 512)
writeIco('favicon.ico', 32, 32)
console.log('Generated public/pwa-192x192.png, public/pwa-512x512.png, public/favicon.ico')
