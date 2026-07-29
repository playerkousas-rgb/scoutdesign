import type { BadgeDesign, Project, WoggleDesign } from './models'
import { processColorLimit } from './rules'

function mdEscape(s: string): string {
  return s.replaceAll('\\', '\\\\').replaceAll('|', '\\|').replaceAll('\n', '<br/>')
}

export function projectToJSON(project: Project): string {
  return JSON.stringify(project, null, 2)
}

export function projectToMarkdown(project: Project): string {
  const base = `# 設計規格書 / Design Specification\n\n- Project ID: \`${project.id}\`\n- Type: **${project.type}**\n- Updated: ${project.updated_at}\n\n---\n\n`
  if (project.type === 'Badge' && project.badge) return base + badgeToMarkdown(project.badge)
  if (project.type === 'Woggle' && project.woggle) return base + woggleToMarkdown(project.woggle)
  return base + '_No data._\n'
}

export function badgeToMarkdown(b: BadgeDesign): string {
  const limit = processColorLimit(b.tech_specs.process)
  const flatPrompt = badgeToFlatPrompt(b)
  const craftPrompt = badgeToCraftPrompt(b)
  return [
    `## 1. 產品：童軍紀念章 (Badge)`,
    `\n### 1.1 結構`,
    `| 欄位 | 值 |`,
    `|---|---|`,
    `| Structure | **${b.structure}** |`,
    b.structure === 'Puzzle'
      ? `| Assembly tolerance | **${b.tech_specs.assembly_tolerance_mm.toFixed(1)}mm** (edge allowance) |`
      : `| Assembly tolerance | ${b.tech_specs.assembly_tolerance_mm.toFixed(1)}mm |`,
    `\n### 1.2 內容`,
    `| 欄位 | 值 |`,
    `|---|---|`,
    `| Theme | ${mdEscape(b.theme || '(未填)')} |`,
    `| Text (ZH) | ${mdEscape(b.elements.text_zh || '(未填)')} |`,
    `| Text (EN) | ${mdEscape(b.elements.text_en || '(未填)')} |`,
    `| Text height | **${b.elements.text_height_mm}mm** |`,
    `| Style notes | ${mdEscape(b.style_notes || '(未填)')} |`,
    `\n### 1.3 工藝/材料 (Tech Specs)`,
    `| 欄位 | 值 |`,
    `|---|---|`,
    `| Process | **${b.tech_specs.process}** |`,
    `| Hollow-out (Cut-out) | **${b.tech_specs.hollow_out ? 'Yes' : 'No'}** |`,
    `| Support width | ${b.tech_specs.support_width_mm}mm |`,
    `| 3D Embroidery | ${b.tech_specs.embroidery_3d ? 'Yes' : 'No'} |`,
    `| Colors | ${b.tech_specs.colors.length}/${limit} |`,
    `| Pantone | ${mdEscape(b.tech_specs.pantone_codes.join(', ') || '-') } |`,
    `\n### 1.4 色票 (Hex)`,
    ...b.tech_specs.colors.map((c, i) => `- ${i + 1}. \`${c}\``),
    `\n### 1.5 禁止項目 (Blacklist)`,
    b.elements.forbidden_items.length
      ? b.elements.forbidden_items.map((x) => `- ${mdEscape(x)}`).join('\n')
      : '- (none)',
    `\n### 1.6 檢查清單`,
    `- 文字高度 ≥ 4mm (刺繡建議)`,
    `- Cut-out 需確保支撐 ≥ 3mm (刺繡)`,
    `- 併合章需預留 0.5mm 公差`,
    `\n### 1.7 AI 提示詞 (Prompts)`,
    `#### 平面設計稿 Prompt (Flat 2D / Graphic)`,
    `\`\`\`\n${flatPrompt}\n\`\`\``,
    `\n#### 工藝效果圖 Prompt (Craft 3D / Production)`,
    `\`\`\`\n${craftPrompt}\n\`\`\``,
    `\n`,
  ].join('\n')
}

export function woggleToMarkdown(w: WoggleDesign): string {
  const flatPrompt = woggleToFlatPrompt(w)
  const craftPrompt = woggleToCraftPrompt(w)
  return [
    `## 1. 產品：童軍紀念巾圈 (Woggle)`,
    `\n### 1.1 維度/材質`,
    `| 欄位 | 值 |`,
    `|---|---|`,
    `| Dimension | **${w.tech_specs.dimension}** |`,
    `| Material (2D) | ${w.tech_specs.material_2d} |`,
    `| Material (3D) | ${w.tech_specs.material_3d} |`,
    `\n### 1.2 物理規格`,
    `| 欄位 | 值 |`,
    `|---|---|`,
    `| Inner diameter | **${w.tech_specs.inner_diameter_mm}mm** (locked) |`,
    `| Closed ring | **${w.tech_specs.has_closed_ring ? 'Yes' : 'No'}** |`,
    `| Sharp edges risk | ${w.tech_specs.has_sharp_edges ? 'Yes' : 'No'} |`,
    `\n### 1.3 內容`,
    `| 欄位 | 值 |`,
    `|---|---|`,
    `| Theme | ${mdEscape(w.theme || '(未填)')} |`,
    `| Text (ZH) | ${mdEscape(w.elements.text_zh || '(未填)')} |`,
    `| Text (EN) | ${mdEscape(w.elements.text_en || '(未填)')} |`,
    `| Text height | **${w.elements.text_height_mm}mm** |`,
    `| Style notes | ${mdEscape(w.style_notes || '(未填)')} |`,
    w.tech_specs.dimension === '3D'
      ? `| Modeling notes | ${mdEscape(w.tech_specs.modeling_notes || '(未填)')} |`
      : `| Modeling notes | (n/a) |`,
    `\n### 1.4 色票 (Hex)`,
    ...w.tech_specs.colors.map((c, i) => `- ${i + 1}. \`${c}\``),
    `\n### 1.5 禁止項目 (Blacklist)`,
    w.elements.forbidden_items.length
      ? w.elements.forbidden_items.map((x) => `- ${mdEscape(x)}`).join('\n')
      : '- (none)',
    `\n### 1.6 檢查清單`,
    `- 內徑 22mm`,
    `- 必須閉合環，確保領巾可穿過`,
    `- 無銳角/倒角處理`,
    `\n### 1.7 AI 提示詞 (Prompts)`,
    `#### 平面設計稿 Prompt (Flat 2D / Graphic)`,
    `\`\`\`\n${flatPrompt}\n\`\`\``,
    `\n#### 工藝效果圖 Prompt (Craft 3D / Production)`,
    `\`\`\`\n${craftPrompt}\n\`\`\``,
    `\n`,
  ].join('\n')
}

export function projectToFlatPrompt(project: Project): string {
  if (project.type === 'Badge' && project.badge) return badgeToFlatPrompt(project.badge)
  if (project.type === 'Woggle' && project.woggle) return woggleToFlatPrompt(project.woggle)
  return ''
}

export function projectToCraftPrompt(project: Project): string {
  if (project.type === 'Badge' && project.badge) return badgeToCraftPrompt(project.badge)
  if (project.type === 'Woggle' && project.woggle) return woggleToCraftPrompt(project.woggle)
  return ''
}

export function projectToAIPrompt(project: Project, mode: 'flat' | 'craft' = 'craft'): string {
  if (mode === 'flat') return projectToFlatPrompt(project)
  return projectToCraftPrompt(project)
}

function badgeToFlatPrompt(b: BadgeDesign): string {
  const textSection = (b.elements.text_en || b.elements.text_zh)
    ? `include bold legible typography: English text "${b.elements.text_en || ''}"${b.elements.text_zh ? ` and Chinese characters "${b.elements.text_zh}"` : ''},`
    : 'purely visual emblem without any text or lettering,'

  const palette = b.tech_specs.pantone_codes.length && b.tech_specs.pantone_codes.some(Boolean)
    ? `Pantone color palette: ${b.tech_specs.pantone_codes.filter(Boolean).join(', ')}`
    : `Color palette (hex): ${b.tech_specs.colors.join(', ')}`

  const theme = b.theme || 'scouting symbols'
  const structure =
    b.structure === 'Puzzle'
      ? 'interlocking multi-piece puzzle badge set graphic design (separate A/B/C interlocking shapes)'
      : b.structure === 'Set'
        ? 'cohesive scout badge series / set graphic design'
        : 'single scout commemorative badge graphic design'

  return [
    'Midjourney / DALL·E prompt (Flat Graphic Design / 2D Vector):',
    `2D flat graphic design vector artwork for a ${structure}.`,
    `Theme: ${theme}.`,
    textSection,
    `Style: ${b.style_notes || 'minimal modern vector icon, bold outlines, clean geometric symmetry'}.`,
    `${palette}.`,
    'Pure 2D vector illustration, crisp bold outlines, high-contrast emblem, centered composition on a solid clean white background, no 3D rendering, no shadows, no fabric texture, suitable for vector tracing and die-line reference.',
  ].join(' ')
}

function badgeToCraftPrompt(b: BadgeDesign): string {
  const textSection = (b.elements.text_en || b.elements.text_zh)
    ? `featuring raised legible text: "${b.elements.text_en || ''}"${b.elements.text_zh ? ` and Chinese characters "${b.elements.text_zh}"` : ''},`
    : 'purely visual emblem without text,'

  const palette = b.tech_specs.pantone_codes.length && b.tech_specs.pantone_codes.some(Boolean)
    ? `Pantone colors: ${b.tech_specs.pantone_codes.filter(Boolean).join(', ')}`
    : `Color palette (hex): ${b.tech_specs.colors.join(', ')}`

  const theme = b.theme || 'scouting symbols'
  const structure =
    b.structure === 'Puzzle'
      ? 'interlocking multi-piece puzzle badge set assembled together with precise 0.5mm edge tolerance'
      : b.structure === 'Set'
        ? 'scout badge set / series collection'
        : 'single scout commemorative badge'

  const craft =
    b.tech_specs.process === 'Embroidered'
      ? 'realistic physical embroidered scout patch, authentic embroidery thread stitch texture, high-density stitching, merrowed overlocked border edge'
      : b.tech_specs.process === 'Woven'
        ? 'realistic physical woven label scout patch, fine crisp woven threads, ultra-smooth flat surface, clean laser-cut border'
        : b.tech_specs.process === 'HeatTransfer'
          ? 'realistic physical heat-transfer sublimation print on patch fabric, smooth vibrant color gradients, embroidered overlocked border'
          : 'realistic physical 3D soft PVC rubber scout patch, raised embossed layered relief, matte rubber texture, stitching channel around border'

  const extras = [
    b.tech_specs.hollow_out ? `custom cut-out / hollow-out negative space areas (reinforced support width ≥ ${b.tech_specs.support_width_mm}mm)` : 'solid back without cut-out',
    b.tech_specs.embroidery_3d ? 'prominent 3D puff embroidery with thick raised relief on primary symbols and text' : 'flat surface profile',
  ].join('; ')

  return [
    'Midjourney / DALL·E prompt (Craft / 3D Physical Production Render):',
    `Professional studio product photography of a ${craft}, depicting a ${structure}.`,
    `Theme: ${theme}.`,
    textSection,
    `Style notes: ${b.style_notes || 'high-end commemorative finish, clean craftsmanship, durable outdoor aesthetic'}.`,
    `Craft specs & details: ${extras}.`,
    `${palette}.`,
    'High-end macro photography of physical manufactured scout patch resting on a neutral dark tactical fabric background, crisp studio rim lighting, realistic depth of field showing authentic material texture, threads, and physical shadow.',
  ].join(' ')
}

function woggleToFlatPrompt(w: WoggleDesign): string {
  const dim = w.tech_specs.dimension
  const palette = w.tech_specs.pantone_codes.length && w.tech_specs.pantone_codes.some(Boolean)
    ? `Pantone color palette: ${w.tech_specs.pantone_codes.filter(Boolean).join(', ')}`
    : `Color palette (hex): ${w.tech_specs.colors.join(', ')}`

  const textSection = (w.elements.text_en || w.elements.text_zh)
    ? `text lettering: "${w.elements.text_en || ''}"${w.elements.text_zh ? ` and Chinese characters "${w.elements.text_zh}"` : ''},`
    : 'purely visual emblem without text,'

  return [
    'Midjourney / DALL·E prompt (Flat Graphic Design / 2D Vector):',
    `2D flat graphic design vector artwork for a scout neckerchief woggle (${dim}) emblem.`,
    `Theme: ${w.theme || 'scouting symbols'}.`,
    textSection,
    `Style: ${w.style_notes || 'minimal modern emblem, bold clean lines, clear symmetry'}.`,
    `${palette}.`,
    'Pure 2D vector illustration, clean outlines, flat colors on a plain solid white background, no 3D rendering, no shadows, suitable for engraving or relief pattern tracing.',
  ].join(' ')
}

function woggleToCraftPrompt(w: WoggleDesign): string {
  const dim = w.tech_specs.dimension
  const material = dim === '2D' ? w.tech_specs.material_2d : w.tech_specs.material_3d
  const palette = w.tech_specs.pantone_codes.length && w.tech_specs.pantone_codes.some(Boolean)
    ? `Pantone palette: ${w.tech_specs.pantone_codes.filter(Boolean).join(', ')}`
    : `Color palette (hex): ${w.tech_specs.colors.join(', ')}`

  const materialDesc =
    material === 'CastMetal'
      ? 'realistic physical cast metal antique bronze/pewter scout woggle (neckerchief slide), 3D sculpted metallic relief, patina in recessed areas, R1.0 rounded safety edges, closed ring structure with 30mm inner diameter'
      : material === '3DPrint'
        ? 'realistic physical 3D printed matte resin/nylon scout woggle (neckerchief slide), smooth clean surface finish, precision sculpted emblem, closed ring structure with 30mm inner diameter'
        : material === 'Leather'
          ? 'realistic physical genuine leather scout woggle (neckerchief slide), debossed and foil-stamped emblem, heavy-duty stitched closed ring'
          : material === 'Metal'
            ? 'realistic physical enamel metal scout woggle (neckerchief slide), polished metal plating with recessed soft enamel colors, smooth rounded safety edges'
            : 'realistic physical soft PVC rubber scout woggle (neckerchief slide), molded colorful 3D relief, durable closed ring'

  const textSection = (w.elements.text_en || w.elements.text_zh)
    ? `featuring engraved/raised text: "${w.elements.text_en || ''}"${w.elements.text_zh ? ` and Chinese "${w.elements.text_zh}"` : ''},`
    : 'purely visual emblem without text,'

  return [
    'Midjourney / DALL·E prompt (Craft / 3D Physical Production Render):',
    `Professional studio product photography of a ${materialDesc}.`,
    `Theme: ${w.theme || 'scouting symbols'}.`,
    textSection,
    `Style: ${w.style_notes || 'minimal modern craftsmanship, durable, safe rounded edges without sharp corners'}.`,
    dim === '3D' ? `3D sculpt details: ${w.tech_specs.modeling_notes || 'sculpted scout emblem integrated into closed ring'}.` : '2D relief / flat emblem integrated onto closed ring.',
    `${palette}.`,
    'Professional studio macro photograph of physical woggle product on a clean neutral studio background, crisp lighting, realistic shadows, and authentic material finish.',
  ].join(' ')
}

export function designToSVG(project: Project): string {
  // Simple schematic SVG for factory communication.
  // Badge: circle/rounded-rect; Woggle: ring with emblem block.
  const w = 900
  const h = 560
  const bg = '#0b1220'
  const fg = '#E6E9F2'
  const grid = '#22304a'

  const header = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`
  const defs = `
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7C3AED" stop-opacity="0.9"/>
      <stop offset="1" stop-color="#06B6D4" stop-opacity="0.9"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#000" flood-opacity="0.45"/>
    </filter>
  </defs>`

  const bgRect = `\n  <rect width="100%" height="100%" fill="${bg}"/>\n  <g opacity="0.9">\n    ${Array.from({ length: 12 })
      .map((_, i) => {
        const y = 40 + i * 40
        return `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="${grid}" stroke-width="1"/>`
      })
      .join('')}\n  </g>`

  const title =
    project.type === 'Badge'
      ? project.badge?.theme || 'Badge schematic'
      : project.woggle?.theme || 'Woggle schematic'

  const caption = `\n  <text x="40" y="58" fill="${fg}" font-family="ui-sans-serif, system-ui" font-size="22" font-weight="700">${escapeXml(
    title,
  )}</text>\n  <text x="40" y="86" fill="#9DB0D0" font-family="ui-sans-serif, system-ui" font-size="13">Draft SVG layout • For factory communication</text>`

  let body = ''
  if (project.type === 'Badge' && project.badge) {
    const b = project.badge
    const palette = b.tech_specs.colors
    const shape =
      b.structure === 'Puzzle'
        ? `<path d="M 290 170 h 320 a 30 30 0 0 1 30 30 v 60 h 30 a 25 25 0 0 1 0 50 h -30 v 60 a 30 30 0 0 1 -30 30 h -320 a 30 30 0 0 1 -30 -30 v -60 h -30 a 25 25 0 0 1 0 -50 h 30 v -60 a 30 30 0 0 1 30 -30 z" fill="url(#g)" filter="url(#shadow)"/>`
        : b.structure === 'Set'
          ? `<rect x="280" y="170" width="340" height="240" rx="44" fill="url(#g)" filter="url(#shadow)"/>`
          : `<circle cx="450" cy="290" r="132" fill="url(#g)" filter="url(#shadow)"/>`

    const hollow = b.tech_specs.hollow_out
      ? `<circle cx="450" cy="290" r="38" fill="${bg}" opacity="0.9"/>`
      : ''

    const txt = `<text x="450" y="282" text-anchor="middle" fill="${fg}" font-family="ui-sans-serif, system-ui" font-size="22" font-weight="800">${escapeXml(
      b.elements.text_en || 'TEXT',
    )}</text>
    <text x="450" y="314" text-anchor="middle" fill="#D9E2FF" font-family="ui-sans-serif, system-ui" font-size="18" font-weight="600">${escapeXml(
      b.elements.text_zh || '',
    )}</text>`

    const swatches = palette
      .slice(0, 12)
      .map((c, i) => {
        const x = 660
        const y = 160 + i * 28
        return `<rect x="${x}" y="${y}" width="18" height="18" rx="5" fill="${c}"/><text x="$${
          x + 26
        }" y="${y + 14}" fill="#BFD0FF" font-size="12" font-family="ui-sans-serif, system-ui">${escapeXml(
          c,
        )}</text>`.replace('$${', '${')
      })
      .join('')

    body = `\n  <g>\n    ${shape}\n    ${hollow}\n    ${txt}\n  </g>\n  <text x="660" y="132" fill="#9DB0D0" font-size="12" font-family="ui-sans-serif, system-ui">Color swatches</text>\n  ${swatches}`
  } else if (project.type === 'Woggle' && project.woggle) {
    const wog = project.woggle
    const ring = `
    <g filter="url(#shadow)">
      <circle cx="420" cy="300" r="128" fill="none" stroke="url(#g)" stroke-width="34"/>
      <circle cx="420" cy="300" r="92" fill="${bg}"/>
      ${wog.tech_specs.has_closed_ring ? '' : `<path d="M 540 300 a 120 120 0 0 1 -20 68" stroke="${bg}" stroke-width="40"/>`}
      <rect x="600" y="246" width="210" height="108" rx="26" fill="url(#g)"/>
    </g>`

    const label = `
    <text x="705" y="288" text-anchor="middle" fill="${fg}" font-family="ui-sans-serif, system-ui" font-size="16" font-weight="800">${escapeXml(
      wog.elements.text_en || 'WOGGLE',
    )}</text>
    <text x="705" y="312" text-anchor="middle" fill="#D9E2FF" font-family="ui-sans-serif, system-ui" font-size="14" font-weight="600">${escapeXml(
      wog.elements.text_zh || '',
    )}</text>`

    body = `\n  ${ring}\n  ${label}\n  <text x="40" y="130" fill="#9DB0D0" font-size="12" font-family="ui-sans-serif, system-ui">Inner diameter: 22mm (locked) • Closed ring required</text>`
  }

  const footer = `\n</svg>`

  return header + defs + bgRect + caption + body + footer
}

function escapeXml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}
