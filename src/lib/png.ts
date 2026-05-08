import type { Project } from './models'
import { designToSVG } from './exporters'
import { getPrintCanvasMm, getTargetDpi, mmToPx } from './production'

export async function exportDesignPNG(project: Project, opts?: { width?: number; background?: string }): Promise<Blob> {
  const width = opts?.width ?? 2000
  const background = opts?.background ?? '#0b1220'

  const svg = designToSVG(project)
  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('Failed to load SVG for rasterizing'))
      image.src = url
    })

    const scale = width / img.width
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas not supported')

    ctx.fillStyle = background
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Failed to export PNG'))), 'image/png')
    })

    return blob
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function exportPrintReadyPNG(project: Project, opts?: { background?: string }): Promise<Blob> {
  const background = opts?.background ?? '#0b1220'

  const dpi = getTargetDpi(project)
  const mm = getPrintCanvasMm(project)

  const targetW = mmToPx(mm.w, dpi)
  const targetH = mmToPx(mm.h, dpi)

  const svg = designToSVG(project)
  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('Failed to load SVG for rasterizing'))
      image.src = url
    })

    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas not supported')

    // Fill full bleed area
    ctx.fillStyle = background
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw the SVG centered as the production artwork raster.
    // This guarantees pixel density (DPI via pixel dimensions). For advanced die-line workflows,
    // you can replace this renderer with a cut-contour layout later.
    const scale = Math.min(targetW / img.width, targetH / img.height)
    const dw = img.width * scale
    const dh = img.height * scale
    const dx = (targetW - dw) / 2
    const dy = (targetH - dh) / 2
    ctx.drawImage(img, dx, dy, dw, dh)

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Failed to export PNG'))), 'image/png')
    })

    return blob
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
