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
    `\n`,
  ].join('\n')
}

export function woggleToMarkdown(w: WoggleDesign): string {
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
    `\n`,
  ].join('\n')
}

export function projectToAIPrompt(project: Project): string {
  if (project.type === 'Badge' && project.badge) return badgeToPrompt(project.badge)
  if (project.type === 'Woggle' && project.woggle) return woggleToPrompt(project.woggle)
  return ''
}

function badgeToPrompt(b: BadgeDesign): string {
  const palette = b.tech_specs.pantone_codes.length
    ? `Pantone palette: ${b.tech_specs.pantone_codes.join(', ')}`
    : `Color palette (hex): ${b.tech_specs.colors.join(', ')}`
  const structure =
    b.structure === 'Puzzle'
      ? 'interlocking puzzle badge set with 0.5mm assembly tolerance'
      : b.structure === 'Set'
        ? 'badge set / series'
        : 'single badge'

  const craft =
    b.tech_specs.process === 'Embroidered'
      ? 'embroidered patch, merrowed edge, stitch texture visible'
      : b.tech_specs.process === 'Woven'
        ? 'woven label patch, crisp thin lines'
        : b.tech_specs.process === 'HeatTransfer'
          ? 'heat transfer print patch, smooth gradients allowed'
          : 'soft PVC patch, molded edges'

  const extras = [
    b.tech_specs.hollow_out ? 'cut-out / hollow-out areas' : 'no cut-out',
    b.tech_specs.embroidery_3d ? '3D puff embroidery for key elements' : 'flat surface',
  ].join(', ')

  return [
    'Midjourney / DALL·E prompt (English):',
    `Design a scout commemorative badge, ${structure}.`,
    `Theme: ${b.theme || 'scouting'}.`,
    `Text: "${b.elements.text_en}" and Chinese text "${b.elements.text_zh}" (clear, legible).`,
    `Style: ${b.style_notes || 'minimal modern, bold icon, high readability'}.`,
    `Manufacturing: ${craft}.`,
    `Details: ${extras}.`,
    `${palette}.`,
    'Vector-like, clean outlines, centered composition, factory-producible, no copyrighted logos, no photorealistic background.',
  ].join(' ')
}

function woggleToPrompt(w: WoggleDesign): string {
  const dim = w.tech_specs.dimension
  const material = dim === '2D' ? w.tech_specs.material_2d : w.tech_specs.material_3d
  const palette = w.tech_specs.pantone_codes.length
    ? `Pantone palette: ${w.tech_specs.pantone_codes.join(', ')}`
    : `Color palette (hex): ${w.tech_specs.colors.join(', ')}`

  const base = [
    'Midjourney / DALL·E prompt (English):',
    `Design a scout neckerchief woggle (${dim}) with an inner diameter of 22mm and a closed ring structure.`,
    `Material: ${material}.`,
    `Theme: ${w.theme || 'scouting'}.`,
    `Text: "${w.elements.text_en}" and Chinese text "${w.elements.text_zh}" (optional engraving if metal).`,
    `Style: ${w.style_notes || 'minimal modern, durable, safe rounded edges'}.`,
    dim === '3D' ? `Single-subject sculpt: ${w.tech_specs.modeling_notes}.` : '2D relief / flat emblem integrated on ring.',
    `${palette}.`,
    'Product render on neutral background, clean studio lighting, manufacturable, no sharp edges.',
  ].join(' ')

  return base
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
