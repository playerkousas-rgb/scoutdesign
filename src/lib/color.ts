export type RGB = { r: number; g: number; b: number }
export type CMYK = { c: number; m: number; y: number; k: number }

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export function hexToRgb(hex: string): RGB | null {
  const h = hex.trim().replace('#', '')
  if (![3, 6].includes(h.length)) return null
  const full = h.length === 3 ? h.split('').map((x) => x + x).join('') : h
  const num = Number.parseInt(full, 16)
  if (Number.isNaN(num)) return null
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
}

export function rgbToHex(rgb: RGB): string {
  const r = clamp(Math.round(rgb.r), 0, 255)
  const g = clamp(Math.round(rgb.g), 0, 255)
  const b = clamp(Math.round(rgb.b), 0, 255)
  return (
    '#' +
    [r, g, b]
      .map((v) => {
        const s = v.toString(16).toUpperCase()
        return s.length === 1 ? '0' + s : s
      })
      .join('')
  )
}

export function rgbToCmyk({ r, g, b }: RGB): CMYK {
  const rr = clamp(r, 0, 255) / 255
  const gg = clamp(g, 0, 255) / 255
  const bb = clamp(b, 0, 255) / 255

  const k = 1 - Math.max(rr, gg, bb)
  if (k >= 0.999999) return { c: 0, m: 0, y: 0, k: 100 }

  const c = (1 - rr - k) / (1 - k)
  const m = (1 - gg - k) / (1 - k)
  const y = (1 - bb - k) / (1 - k)

  return {
    c: Math.round(clamp(c * 100, 0, 100)),
    m: Math.round(clamp(m * 100, 0, 100)),
    y: Math.round(clamp(y * 100, 0, 100)),
    k: Math.round(clamp(k * 100, 0, 100)),
  }
}

export function cmykToRgb({ c, m, y, k }: CMYK): RGB {
  const cc = clamp(c, 0, 100) / 100
  const mm = clamp(m, 0, 100) / 100
  const yy = clamp(y, 0, 100) / 100
  const kk = clamp(k, 0, 100) / 100

  const r = 255 * (1 - cc) * (1 - kk)
  const g = 255 * (1 - mm) * (1 - kk)
  const b = 255 * (1 - yy) * (1 - kk)

  return { r: Math.round(r), g: Math.round(g), b: Math.round(b) }
}
