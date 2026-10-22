/// <reference types="node" />
import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const publicDir = path.resolve(import.meta.dirname, '../../public')
const read = (file: string) => readFileSync(path.join(publicDir, file), 'utf8')

type ManifestIcon = { src: string; sizes: string; type: string; purpose?: string }

describe('PWA 정적 자산', () => {
  const manifest = JSON.parse(read('manifest.webmanifest')) as Record<string, unknown> & {
    icons: ManifestIcon[]
  }

  it('manifest에 설치 가능 조건의 필수 필드가 있다', () => {
    expect(manifest.name).toBe('chewit')
    expect(manifest.short_name).toBeTruthy()
    expect(manifest.display).toBe('standalone')
    expect(manifest.start_url).toBe('/')
    expect(manifest.theme_color).toMatch(/^#[0-9a-f]{6}$/i)
    expect(manifest.background_color).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('manifest 아이콘은 192/512와 maskable을 포함하고 실제 PNG 파일이 있다', () => {
    const find = (sizes: string, purpose: string) =>
      manifest.icons.find((i) => i.sizes === sizes && i.purpose === purpose)
    expect(find('192x192', 'any')).toBeDefined()
    expect(find('512x512', 'any')).toBeDefined()
    expect(find('512x512', 'maskable')).toBeDefined()

    for (const icon of manifest.icons) {
      const file = path.join(publicDir, icon.src)
      expect(existsSync(file), icon.src).toBe(true)
      const png = readFileSync(file)
      expect([...png.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      const [w, h] = icon.sizes.split('x').map(Number)
      expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([w, h])
    }
  })

  it('index.html이 manifest, apple-touch-icon, 라이트/다크 theme-color를 연결한다', () => {
    const html = readFileSync(path.resolve(publicDir, '../index.html'), 'utf8')
    expect(html).toContain('rel="manifest" href="/manifest.webmanifest"')
    expect(html).toContain('rel="apple-touch-icon" href="/icons/apple-touch-icon.png"')
    expect(html).toMatch(/name="theme-color"[^>]*prefers-color-scheme: light/)
    expect(html).toMatch(/name="theme-color"[^>]*prefers-color-scheme: dark/)
    expect(existsSync(path.join(publicDir, 'icons/apple-touch-icon.png'))).toBe(true)
  })
})
