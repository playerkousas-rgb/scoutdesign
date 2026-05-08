export type ProjectType = 'Badge' | 'Woggle'

export type BadgeStructure = 'Single' | 'Set' | 'Puzzle'
export type BadgeProcess = 'Embroidered' | 'Woven' | 'HeatTransfer' | 'PVC'

export type WoggleDimension = '2D' | '3D'
export type WoggleMaterial2D = 'Leather' | 'Metal' | 'PVC'
export type WoggleMaterial3D = 'CastMetal' | '3DPrint'

export type TextSpec = {
  text_zh: string
  text_en: string
  // for Rule 01
  text_height_mm: number
  forbidden_items: string[]
}

export type TechSpecsBadge = {
  process: BadgeProcess
  hollow_out: boolean
  embroidery_3d: boolean
  // for Rule 02 (support structure)
  support_width_mm: number
  // for Rule 03 (auto tolerance for puzzle)
  assembly_tolerance_mm: number
  colors: string[] // hex
  pantone_codes: string[]

  // Production export (print-ready)
  finished_size_mm: number
  bleed_mm: number
  target_dpi: number
}

export type BadgeDesign = {
  id: string
  type: 'Badge'
  structure: BadgeStructure
  theme: string
  style_notes: string
  elements: TextSpec
  tech_specs: TechSpecsBadge
}

export type TechSpecsWoggle = {
  dimension: WoggleDimension
  material_2d: WoggleMaterial2D
  material_3d: WoggleMaterial3D
  inner_diameter_mm: number // Rule: locked (updated to 30)
  has_closed_ring: boolean // Rule 04
  has_sharp_edges: boolean
  colors: string[]
  pantone_codes: string[]
  // for 3D: single subject modeling
  modeling_notes: string

  // Production export (print-ready)
  bleed_mm: number
  target_dpi: number
}

export type WoggleDesign = {
  id: string
  type: 'Woggle'
  theme: string
  style_notes: string
  elements: TextSpec
  tech_specs: TechSpecsWoggle
}

export type Project = {
  id: string
  type: ProjectType
  badge?: BadgeDesign
  woggle?: WoggleDesign
  created_at: string
  updated_at: string
}

export type ValidationSeverity = 'error' | 'warning' | 'info'
export type ValidationIssue = {
  id: string
  severity: ValidationSeverity
  title: string
  detail: string
  rule?: string
}

export function newId(): string {
  // crypto.randomUUID is supported in modern browsers
  return crypto.randomUUID()
}

export function makeDefaultProject(): Project {
  const now = new Date().toISOString()
  const id = newId()
  return {
    id,
    type: 'Badge',
    created_at: now,
    updated_at: now,
    badge: {
      id: newId(),
      type: 'Badge',
      structure: 'Single',
      theme: '',
      style_notes: '',
      elements: {
        text_zh: '中華民國童軍',
        text_en: 'Scouts of China',
        text_height_mm: 5,
        forbidden_items: ['⚔️', '卍', '18+', 'XXX'],
      },
      tech_specs: {
        process: 'Embroidered',
        hollow_out: false,
        embroidery_3d: false,
        support_width_mm: 3,
        assembly_tolerance_mm: 0,
        colors: ['#C8102E', '#0033A0'],
        pantone_codes: ['PANTONE 186 C', 'PANTONE 286 C'],

        finished_size_mm: 10,
        bleed_mm: 3,
        target_dpi: 300,
      },
    },
    woggle: {
      id: newId(),
      type: 'Woggle',
      theme: '',
      style_notes: '',
      elements: {
        text_zh: '童軍',
        text_en: 'SCOUT',
        text_height_mm: 4.5,
        forbidden_items: ['⚔️', '卍', '18+', 'XXX'],
      },
      tech_specs: {
        dimension: '2D',
        material_2d: 'Metal',
        material_3d: 'CastMetal',
        inner_diameter_mm: 30,
        has_closed_ring: true,
        has_sharp_edges: false,
        colors: ['#2D2926'],
        pantone_codes: ['PANTONE Black C'],
        modeling_notes:
          '單一主體造型：例如「百合徽」或「山岳+羅盤」。避免過薄突出結構，確保可脫模/可打印。',

        bleed_mm: 3,
        target_dpi: 300,
      },
    },
  }
}
