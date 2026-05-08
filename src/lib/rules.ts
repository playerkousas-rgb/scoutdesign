import type { BadgeDesign, Project, ValidationIssue, WoggleDesign } from './models'

function hasForbidden(text: string, forbidden: string[]): string[] {
  const hits: string[] = []
  for (const f of forbidden) {
    if (!f) continue
    if (text.includes(f)) hits.push(f)
  }
  return hits
}

export function validateProject(project: Project): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  if (project.type === 'Badge' && project.badge) {
    issues.push(...validateBadge(project.badge))
  }
  if (project.type === 'Woggle' && project.woggle) {
    issues.push(...validateWoggle(project.woggle))
  }

  return issues
}

export function processColorLimit(process: BadgeDesign['tech_specs']['process']): number {
  switch (process) {
    case 'Embroidered':
      return 9
    case 'Woven':
      return 8
    case 'HeatTransfer':
      return 12
    case 'PVC':
      return 6
    default:
      return 9
  }
}

export function validateBadge(badge: BadgeDesign): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // Basic required
  if (!badge.theme.trim()) {
    issues.push({
      id: 'badge_theme',
      severity: 'info',
      title: '建議填寫主題',
      detail: '主題會影響 AI Prompt 與工廠理解。',
    })
  }

  // Blacklist
  const forbidden = badge.elements.forbidden_items
  const hitsZh = hasForbidden(badge.elements.text_zh, forbidden)
  const hitsEn = hasForbidden(badge.elements.text_en, forbidden)
  if (hitsZh.length || hitsEn.length) {
    issues.push({
      id: 'badge_forbidden',
      severity: 'error',
      title: '文字包含黑名單內容',
      detail: `請移除不允許的項目：${[...new Set([...hitsZh, ...hitsEn])].join(', ')}`,
    })
  }

  // Color count limit
  const limit = processColorLimit(badge.tech_specs.process)
  if (badge.tech_specs.colors.length > limit) {
    issues.push({
      id: 'badge_colors',
      severity: 'error',
      title: '色彩數量超過工藝上限',
      detail: `此工藝最多 ${limit} 色；目前 ${badge.tech_specs.colors.length} 色。`,
    })
  }

  // Rule 01
  if (badge.tech_specs.process === 'Embroidered' && badge.elements.text_height_mm < 4) {
    issues.push({
      id: 'rule_01',
      severity: 'warning',
      title: '刺繡文字可能模糊',
      detail: `文字高度 ${badge.elements.text_height_mm}mm < 4mm，可能導致刺繡糊字。`,
      rule: '[Rule 01]',
    })
  }

  // Rule 02
  if (badge.tech_specs.hollow_out) {
    const minSupport = badge.tech_specs.process === 'Embroidered' ? 3 : 2
    if (badge.tech_specs.support_width_mm < minSupport) {
      issues.push({
        id: 'rule_02',
        severity: 'error',
        title: '鏤空支撐結構不足',
        detail: `支撐寬度 ${badge.tech_specs.support_width_mm}mm < ${minSupport}mm，可能斷裂或變形。`,
        rule: '[Rule 02]',
      })
    } else {
      issues.push({
        id: 'rule_02_info',
        severity: 'info',
        title: '鏤空已啟用',
        detail: `已檢查支撐寬度 ≥ ${minSupport}mm。`,
        rule: '[Rule 02]',
      })
    }
  }

  // Rule 03
  if (badge.structure === 'Puzzle') {
    if (badge.tech_specs.assembly_tolerance_mm < 0.5) {
      issues.push({
        id: 'rule_03',
        severity: 'info',
        title: '已自動套用併合章組裝公差',
        detail: '併合章邊緣需預留 0.5mm 物理組裝公差。系統會自動帶入。',
        rule: '[Rule 03]',
      })
    }
  }

  // Special process cross-check
  if (badge.tech_specs.embroidery_3d && badge.tech_specs.process !== 'Embroidered') {
    issues.push({
      id: 'badge_3d_embroidery',
      severity: 'error',
      title: '3D 立體刺繡僅適用刺繡工藝',
      detail: '請切換工藝為「刺繡」或關閉 3D 立體刺繡。',
    })
  }

  return issues
}

export function validateWoggle(woggle: WoggleDesign): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // Blacklist
  const forbidden = woggle.elements.forbidden_items
  const hitsZh = hasForbidden(woggle.elements.text_zh, forbidden)
  const hitsEn = hasForbidden(woggle.elements.text_en, forbidden)
  if (hitsZh.length || hitsEn.length) {
    issues.push({
      id: 'woggle_forbidden',
      severity: 'error',
      title: '文字包含黑名單內容',
      detail: `請移除不允許的項目：${[...new Set([...hitsZh, ...hitsEn])].join(', ')}`,
    })
  }

  // Inner diameter locked
  if (woggle.tech_specs.inner_diameter_mm !== 30) {
    issues.push({
      id: 'woggle_diameter',
      severity: 'error',
      title: '內徑必須為 30mm',
      detail: `目前 ${woggle.tech_specs.inner_diameter_mm}mm；規範鎖定 30mm（便於領巾穿過）。`,
    })
  }

  // Sharp edges
  if (woggle.tech_specs.has_sharp_edges) {
    issues.push({
      id: 'woggle_sharp',
      severity: 'warning',
      title: '可能存在銳角/割手風險',
      detail: '請調整倒角/圓角，或改用較柔性材質。',
    })
  }

  // Rule 04
  if (!woggle.tech_specs.has_closed_ring) {
    issues.push({
      id: 'rule_04',
      severity: 'error',
      title: '巾圈必須具備閉合環結構',
      detail: '需確保領巾可穿過且不會脫落。請開啟「閉合環」。',
      rule: '[Rule 04]',
    })
  }

  // Dimension hints
  if (woggle.tech_specs.dimension === '3D' && !woggle.tech_specs.modeling_notes.trim()) {
    issues.push({
      id: 'woggle_modeling',
      severity: 'info',
      title: '建議提供 3D 主體造型描述',
      detail: '例如「百合徽 + 繩結紋理 + 霧面金屬」等。',
    })
  }

  return issues
}
