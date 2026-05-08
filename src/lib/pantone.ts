export type PantoneColor = {
  code: string
  name: string
  hex: string
}

// A small curated in-app Pantone-like palette for demo/offline use.
// In production, you could replace this with a licensed Pantone dataset.
export const PANTONE_CORE: PantoneColor[] = [
  { code: 'PANTONE 186 C', name: 'Red', hex: '#C8102E' },
  { code: 'PANTONE 116 C', name: 'Yellow', hex: '#FFCD00' },
  { code: 'PANTONE 286 C', name: 'Blue', hex: '#0033A0' },
  { code: 'PANTONE 347 C', name: 'Green', hex: '#009A44' },
  { code: 'PANTONE 021 C', name: 'Orange', hex: '#FE5000' },
  { code: 'PANTONE 2597 C', name: 'Purple', hex: '#5B2C83' },
  { code: 'PANTONE 7541 C', name: 'Navy', hex: '#23395B' },
  { code: 'PANTONE 7406 C', name: 'Gold', hex: '#F1C400' },
  { code: 'PANTONE Black C', name: 'Black', hex: '#2D2926' },
  { code: 'PANTONE Cool Gray 9 C', name: 'Gray', hex: '#75787B' },
  { code: 'PANTONE 7486 C', name: 'Mint', hex: '#9AE19D' },
  { code: 'PANTONE 705 C', name: 'Pink', hex: '#F9B5C0' },
]

export function findPantone(query: string): PantoneColor[] {
  const q = query.trim().toLowerCase()
  if (!q) return PANTONE_CORE
  return PANTONE_CORE.filter((c) =>
    `${c.code} ${c.name}`.toLowerCase().includes(q),
  )
}
