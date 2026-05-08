import type { Project } from './models'

export function mmToPx(mm: number, dpi: number): number {
  return Math.round((mm / 25.4) * dpi)
}

export function getTargetDpi(project: Project): number {
  if (project.type === 'Badge' && project.badge) return project.badge.tech_specs.target_dpi
  if (project.type === 'Woggle' && project.woggle) return project.woggle.tech_specs.target_dpi
  return 300
}

export function getBleedMm(project: Project): number {
  if (project.type === 'Badge' && project.badge) return project.badge.tech_specs.bleed_mm
  if (project.type === 'Woggle' && project.woggle) return project.woggle.tech_specs.bleed_mm
  return 3
}

export function getFinishedSizeMm(project: Project): number {
  if (project.type === 'Badge' && project.badge) return project.badge.tech_specs.finished_size_mm
  // For woggle, finished size for print-ready artwork is the emblem block size.
  // Use 20mm as a conservative default if not specified elsewhere.
  return 20
}

export function getPrintCanvasMm(project: Project): { w: number; h: number } {
  const bleed = getBleedMm(project)
  const size = getFinishedSizeMm(project)
  return { w: size + bleed * 2, h: size + bleed * 2 }
}
