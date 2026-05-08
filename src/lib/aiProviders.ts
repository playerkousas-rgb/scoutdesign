import type { Project } from './models'
import { projectToAIPrompt } from './exporters'
import type { ProviderSecrets } from './userSecrets'

export type AIProvider = 'CloudflareWorkersAI' | 'Leonardo'

export type GenerateImageParams = {
  project: Project
  extra?: string
  size: number
  steps: number
  secrets?: ProviderSecrets
}

export type GenerateResult = { dataUrl: string; provider: AIProvider; prompt: string }

function dataUrlFromArrayBuffer(buf: ArrayBuffer, mime: string): Promise<string> {
  const blob = new Blob([buf], { type: mime })
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read image'))
    reader.onload = () => resolve(String(reader.result))
    reader.readAsDataURL(blob)
  })
}

function buildPrompt(project: Project, extra?: string): string {
  const base = projectToAIPrompt(project)
  const add = (extra ?? '').trim()
  return add ? `${base}\n\nExtra constraints: ${add}` : base
}

export async function generateImage(provider: AIProvider, params: GenerateImageParams): Promise<GenerateResult> {
  const prompt = buildPrompt(params.project, params.extra)

  if (provider === 'CloudflareWorkersAI') {
    const endpoint =
      params.secrets?.cfEndpoint || (import.meta.env.VITE_CF_WORKERS_AI_ENDPOINT as string | undefined) || ''
    const token = params.secrets?.cfToken || (import.meta.env.VITE_CF_WORKERS_AI_TOKEN as string | undefined) || ''

    if (!endpoint) throw new Error('Missing Cloudflare endpoint (set in Settings or VITE_CF_WORKERS_AI_ENDPOINT)')
    if (!token) throw new Error('Missing Cloudflare token (set in Settings or VITE_CF_WORKERS_AI_TOKEN)')

    // Expected worker contract (you will fill in on your side):
    // POST { prompt, width, height, steps }
    // -> returns image bytes (png) OR { image: base64 }
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'image/png,application/json',
      },
      body: JSON.stringify({
        prompt,
        width: params.size,
        height: params.size,
        steps: params.steps,
        model: 'sdxl',
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Cloudflare Workers AI error: ${res.status} ${res.statusText}${text ? ` — ${text.slice(0, 220)}` : ''}`)
    }

    const ct = res.headers.get('content-type') ?? ''
    if (ct.includes('application/json')) {
      const j = (await res.json()) as { image?: string; mime?: string }
      if (!j.image) throw new Error('Workers AI: JSON response missing image')
      const mime = j.mime ?? 'image/png'
      const dataUrl = `data:${mime};base64,${j.image}`
      return { dataUrl, provider, prompt }
    }

    const buf = await res.arrayBuffer()
    const dataUrl = await dataUrlFromArrayBuffer(buf, 'image/png')
    return { dataUrl, provider, prompt }
  }

  // Leonardo.ai
  const endpoint =
    params.secrets?.leonardoEndpoint || (import.meta.env.VITE_LEONARDO_ENDPOINT as string | undefined) || ''
  const apiKey = params.secrets?.leonardoApiKey || (import.meta.env.VITE_LEONARDO_API_KEY as string | undefined) || ''

  if (!endpoint) throw new Error('Missing Leonardo endpoint (set in Settings or VITE_LEONARDO_ENDPOINT)')
  if (!apiKey) throw new Error('Missing Leonardo API key (set in Settings or VITE_LEONARDO_API_KEY)')

  // We reserve an integration slot with a minimal, common shape:
  // POST { prompt, width, height, steps }
  // -> { image_url } OR { image_base64 }
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      prompt,
      width: params.size,
      height: params.size,
      steps: params.steps,
      stylePreset: 'sticker',
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Leonardo error: ${res.status} ${res.statusText}${text ? ` — ${text.slice(0, 220)}` : ''}`)
  }

  const j = (await res.json()) as { image_url?: string; image_base64?: string; mime?: string }
  if (j.image_base64) {
    const mime = j.mime ?? 'image/png'
    return { dataUrl: `data:${mime};base64,${j.image_base64}`, provider, prompt }
  }
  if (j.image_url) {
    // Fetch image and convert to data URL
    const imgRes = await fetch(j.image_url)
    if (!imgRes.ok) throw new Error('Leonardo image fetch failed')
    const buf = await imgRes.arrayBuffer()
    const mime = imgRes.headers.get('content-type') ?? 'image/png'
    const dataUrl = await dataUrlFromArrayBuffer(buf, mime)
    return { dataUrl, provider, prompt }
  }

  throw new Error('Leonardo response missing image_url/image_base64')
}
