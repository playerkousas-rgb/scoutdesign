import jsPDF from 'jspdf'
import { svg2pdf } from 'svg2pdf.js'
import type { Project } from './models'
import { projectToMarkdown } from './exporters'

export type PdfOptions = {
  title: string
  includeBleed: boolean
  bleedMm: number
  dpi: number
}

function mmToPt(mm: number): number {
  return (mm / 25.4) * 72
}

function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function svgToPdf(doc: jsPDF, svgString: string, xPt: number, yPt: number, wPt: number, hPt: number) {
  const svgEl = document.createElement('div')
  svgEl.innerHTML = svgString
  const svg = svgEl.querySelector('svg')
  if (!svg) throw new Error('Invalid SVG')

  // svg2pdf expects a real SVGElement
  await svg2pdf(svg as unknown as SVGElement, doc as any, {
    x: xPt,
    y: yPt,
    width: wPt,
    height: hPt,
  })
}

function swatchGrid(project: Project): Array<{ hex: string; label: string }> {
  if (project.type === 'Badge' && project.badge) {
    return project.badge.tech_specs.colors.map((hex, i) => ({
      hex,
      label: project.badge!.tech_specs.pantone_codes[i] ?? hex,
    }))
  }
  if (project.type === 'Woggle' && project.woggle) {
    return project.woggle.tech_specs.colors.map((hex, i) => ({
      hex,
      label: project.woggle!.tech_specs.pantone_codes[i] ?? hex,
    }))
  }
  return []
}

export async function exportFactoryPdf(opts: {
  project: Project
  flatSvg: string
  effectImageDataUrl?: string // optional AI render
  pdfOptions?: Partial<PdfOptions>
}): Promise<Blob> {
  const options: PdfOptions = {
    title: 'Factory Spec',
    includeBleed: true,
    bleedMm: 3,
    dpi: 300,
    ...opts.pdfOptions,
  }

  // A4 portrait in pt
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })

  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  const margin = mmToPt(12)
  const bleed = options.includeBleed ? mmToPt(options.bleedMm) : 0

  // Header
  doc.setFillColor(11, 18, 32)
  doc.rect(0, 0, pageW, 78, 'F')
  doc.setTextColor(230, 233, 242)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('Scout Factory Designer — Specification Pack', margin, 34)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(175, 190, 220)
  doc.text(`Project: ${opts.project.id}    Type: ${opts.project.type}    Date: ${today()}    Target: ${options.dpi} DPI`, margin, 56)

  // Bleed zone: in real print files, artwork should extend into the bleed.
  // Here we visualize (and *fill*) the bleed zone so the exported PDF is closer to a print-ready layout.
  if (options.includeBleed) {
    doc.setFillColor(8, 13, 26)
    doc.rect(0, 0, pageW, pageH, 'F')

    // Trim area background
    doc.setFillColor(11, 18, 32)
    doc.rect(bleed, bleed, pageW - bleed * 2, pageH - bleed * 2, 'F')

    // Guides
    doc.setDrawColor(255, 99, 102)
    doc.setLineWidth(1)
    doc.setLineDashPattern([4, 3], 0)
    doc.rect(bleed, bleed, pageW - bleed * 2, pageH - bleed * 2)
    doc.setLineDashPattern([], 0)
    doc.setTextColor(255, 180, 180)
    doc.setFontSize(9)
    doc.text(`Bleed zone: ${options.bleedMm}mm (artwork extends)`, bleed + 6, bleed + 16)
  }

  // Layout: left (flat design), right (effect render + swatches)
  const contentTop = 92
  const colGap = 14
  const colW = (pageW - margin * 2 - colGap) / 2

  // Flat design panel
  doc.setDrawColor(255, 255, 255)
  doc.setTextColor(230, 233, 242)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('A. Flat Design (Vector Draft)', margin, contentTop)

  doc.setDrawColor(255, 255, 255)
  doc.setLineWidth(0.6)
  doc.setDrawColor(255)

  const flatBoxY = contentTop + 10
  const flatBoxH = 290
  doc.setDrawColor(255, 255, 255)
  doc.setFillColor(15, 23, 42)
  doc.roundedRect(margin, flatBoxY, colW, flatBoxH, 10, 10, 'FD')

  await svgToPdf(doc, opts.flatSvg, margin + 14, flatBoxY + 14, colW - 28, flatBoxH - 28)

  // Effect render panel
  const rightX = margin + colW + colGap
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(230, 233, 242)
  doc.text('B. Process Effect Render (AI Render)', rightX, contentTop)

  const effBoxY = contentTop + 10
  const effBoxH = 210
  doc.setFillColor(15, 23, 42)
  doc.roundedRect(rightX, effBoxY, colW, effBoxH, 10, 10, 'FD')

  if (opts.effectImageDataUrl) {
    // Use PNG/JPEG data URL
    const isPng = opts.effectImageDataUrl.startsWith('data:image/png')
    doc.addImage(opts.effectImageDataUrl, isPng ? 'PNG' : 'JPEG', rightX + 14, effBoxY + 14, colW - 28, effBoxH - 28, undefined, 'FAST')
  } else {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(160, 175, 210)
    doc.text('No AI render attached. Generate an image in the AI panel first.', rightX + 18, effBoxY + 34)
  }

  // Color plates / swatches
  const swatches = swatchGrid(opts.project)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(230, 233, 242)
  doc.text('C. Color Plates', rightX, effBoxY + effBoxH + 28)

  const swBoxY = effBoxY + effBoxH + 38
  const swBoxH = 142
  doc.setFillColor(15, 23, 42)
  doc.roundedRect(rightX, swBoxY, colW, swBoxH, 10, 10, 'FD')

  const swPad = 14
  const swX = rightX + swPad
  const swY = swBoxY + swPad
  const swSize = 18
  const swPerCol = 5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  for (let i = 0; i < Math.min(swatches.length, 10); i++) {
    const row = i % swPerCol
    const col = Math.floor(i / swPerCol)
    const x = swX + col * (colW / 2)
    const y = swY + row * 24

    const hex = swatches[i].hex
    const rgb = hexToRgbSafe(hex)
    doc.setFillColor(rgb.r, rgb.g, rgb.b)
    doc.roundedRect(x, y - 12, swSize, swSize, 5, 5, 'F')

    doc.setTextColor(220, 230, 255)
    doc.text(swatches[i].label, x + swSize + 8, y)
  }

  // Specs text (markdown snippet)
  const md = projectToMarkdown(opts.project)
  doc.addPage('a4', 'portrait')
  doc.setFillColor(11, 18, 32)
  doc.rect(0, 0, pageW, 78, 'F')
  doc.setTextColor(230, 233, 242)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('D. Technical Specs (Markdown Snapshot)', margin, 34)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(175, 190, 220)
  doc.text('This is a snapshot for factory reading; the MD export remains the source of truth.', margin, 56)

  doc.setFont('courier', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(20, 30, 50)
  doc.setFillColor(240, 244, 255)
  doc.roundedRect(margin, 96, pageW - margin * 2, pageH - 96 - margin, 10, 10, 'F')
  doc.setTextColor(15, 23, 42)

  const maxChars = 6000
  const snippet = md.length > maxChars ? md.slice(0, maxChars) + '\n\n...(truncated)' : md
  const lines = doc.splitTextToSize(snippet, pageW - margin * 2 - 24)
  doc.text(lines as any, margin + 12, 118, { baseline: 'top' } as any)

  // Embed metadata hint for DPI (client-side PDF isn't rasterized; this is a target print spec)
  doc.setProperties({
    title: options.title,
    subject: 'Factory specification pack',
    author: 'Scout Factory Designer',
    keywords: `target_dpi=${options.dpi}, bleed_mm=${options.bleedMm}`,
  })

  return doc.output('blob')
}

function hexToRgbSafe(hex: string): { r: number; g: number; b: number } {
  const h = hex.trim().replace('#', '')
  const full = h.length === 3 ? h.split('').map((x) => x + x).join('') : h
  const num = Number.parseInt(full, 16)
  if (Number.isNaN(num)) return { r: 120, g: 120, b: 120 }
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
}
