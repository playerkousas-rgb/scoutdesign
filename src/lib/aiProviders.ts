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

  // 強制使用 Cloudflare (既然我們暫不使用 Leonardo)
  if (provider === 'CloudflareWorkersAI') {
    // 1. 這裡現在只需要 Endpoint，因為 Token 鎖在 Worker 保險箱裡了
    const endpoint =
      params.secrets?.cfEndpoint || (import.meta.env.VITE_CF_WORKERS_AI_ENDPOINT as string | undefined) || ''

    if (!endpoint) throw new Error('請在 Vercel 設定 VITE_CF_WORKERS_AI_ENDPOINT')

    // 2. 呼叫你的 Worker
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 注意：這裡移除了 Authorization，因為 Worker 會自己處理
        'Accept': 'image/png,application/json',
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
      throw new Error(`AI 生成失敗: ${res.status} ${res.statusText}${text ? ` — ${text.slice(0, 220)}` : ''}`)
    }

    // 3. 處理回傳結果 (保持你原本優秀的處理邏輯)
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
