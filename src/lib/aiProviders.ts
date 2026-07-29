import type { Project } from './models'
import { projectToAIPrompt } from './exporters'
import type { ProviderSecrets } from './userSecrets'

export type AIProvider =
  | 'CloudflareWorkersAI'
  | 'Leonardo'
  | 'OpenAI_DALLE3'
  | 'TogetherAI'
  | 'Gemini_Imagen'

export type GenerateImageParams = {
  project: Project
  extra?: string
  size: number
  steps: number
  promptMode?: 'flat' | 'craft'
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

export function buildPrompt(project: Project, extra?: string, mode: 'flat' | 'craft' = 'craft'): string {
  const base = projectToAIPrompt(project, mode)
  const add = (extra ?? '').trim()
  return add ? `${base}\n\nExtra constraints: ${add}` : base
}

export async function generateImage(provider: AIProvider, params: GenerateImageParams): Promise<GenerateResult> {
  const promptMode = params.promptMode || 'craft'
  const prompt = buildPrompt(params.project, params.extra, promptMode)

  // 1. OpenAI DALL·E 3 (直接連接 API Key)
  if (provider === 'OpenAI_DALLE3') {
    const apiKey = params.secrets?.openaiApiKey || (import.meta.env.VITE_OPENAI_API_KEY as string | undefined) || ''
    if (!apiKey) throw new Error('請在「API 設定」輸入 OpenAI API Key (sk-...)')

    const rawBase = params.secrets?.openaiBaseUrl || 'https://api.openai.com/v1'
    const baseUrl = rawBase.replace(/\/+$/, '')
    const res = await fetch(`${baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt.slice(0, 3800),
        n: 1,
        size: '1024x1024',
        response_format: 'b64_json',
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`OpenAI DALL·E 3 生圖失敗 (${res.status}): ${text ? text.slice(0, 220) : res.statusText}`)
    }

    const j = (await res.json()) as { data?: Array<{ b64_json?: string; url?: string }> }
    const first = j.data?.[0]
    if (first?.b64_json) {
      return { dataUrl: `data:image/png;base64,${first.b64_json}`, provider, prompt }
    }
    if (first?.url) {
      try {
        const imgRes = await fetch(first.url)
        if (imgRes.ok) {
          const buf = await imgRes.arrayBuffer()
          const mime = imgRes.headers.get('content-type') ?? 'image/png'
          const dataUrl = await dataUrlFromArrayBuffer(buf, mime)
          return { dataUrl, provider, prompt }
        }
      } catch {
        return { dataUrl: first.url, provider, prompt }
      }
      return { dataUrl: first.url, provider, prompt }
    }
    throw new Error('OpenAI 回傳格式缺少圖片資料')
  }

  // 2. Together AI (FLUX.1-schnell / 直接連接 API Key)
  if (provider === 'TogetherAI') {
    const apiKey = params.secrets?.togetherApiKey || (import.meta.env.VITE_TOGETHER_API_KEY as string | undefined) || ''
    if (!apiKey) throw new Error('請在「API 設定」輸入 Together AI API Key')

    const res = await fetch('https://api.together.xyz/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'black-forest-labs/FLUX.1-schnell-Free',
        prompt: prompt.slice(0, 2000),
        width: params.size,
        height: params.size,
        steps: 4,
        n: 1,
        response_format: 'b64_json',
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Together AI 生圖失敗 (${res.status}): ${text ? text.slice(0, 220) : res.statusText}`)
    }

    const j = (await res.json()) as { data?: Array<{ b64_json?: string; url?: string }> }
    const first = j.data?.[0]
    if (first?.b64_json) {
      return { dataUrl: `data:image/png;base64,${first.b64_json}`, provider, prompt }
    }
    if (first?.url) {
      try {
        const imgRes = await fetch(first.url)
        if (imgRes.ok) {
          const buf = await imgRes.arrayBuffer()
          const mime = imgRes.headers.get('content-type') ?? 'image/png'
          const dataUrl = await dataUrlFromArrayBuffer(buf, mime)
          return { dataUrl, provider, prompt }
        }
      } catch {
        return { dataUrl: first.url, provider, prompt }
      }
      return { dataUrl: first.url, provider, prompt }
    }
    throw new Error('Together AI 回傳格式缺少圖片資料')
  }

  // 3. Google Gemini Imagen 3 (直接連接 API Key)
  if (provider === 'Gemini_Imagen') {
    const apiKey = params.secrets?.geminiApiKey || (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) || ''
    if (!apiKey) throw new Error('請在「API 設定」輸入 Google Gemini API Key')

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generateImages:predict?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt: prompt.slice(0, 2000) }],
          parameters: {
            sampleCount: 1,
            aspectRatio: '1:1',
          },
        }),
      },
    )

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Google Gemini Imagen 3 生圖失敗 (${res.status}): ${text ? text.slice(0, 220) : res.statusText}`)
    }

    const j = (await res.json()) as {
      predictions?: Array<{ bytesBase64Encoded?: string; mimeType?: string }>
    }
    const first = j.predictions?.[0]
    if (first?.bytesBase64Encoded) {
      const mime = first.mimeType || 'image/png'
      return { dataUrl: `data:${mime};base64,${first.bytesBase64Encoded}`, provider, prompt }
    }
    throw new Error('Google Gemini 回傳結果中未包含圖片資料 (請檢查 API Key 是否開啟 Imagen 3 權限)')
  }

  // 4. Cloudflare Workers AI (支援 Proxy Endpoint 或直接 Account ID + Token)
  if (provider === 'CloudflareWorkersAI') {
    const endpoint =
      params.secrets?.cfEndpoint || (import.meta.env.VITE_CF_WORKERS_AI_ENDPOINT as string | undefined) || ''
    const accountId = params.secrets?.cfAccountId || ''
    const token = params.secrets?.cfToken || (import.meta.env.VITE_CF_WORKERS_AI_TOKEN as string | undefined) || ''

    // 如果填寫了 Direct Account ID + Token，優先直接調用官方 API
    if (accountId && token) {
      const directUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0`
      const res = await fetch(directUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'image/png,application/json',
        },
        body: JSON.stringify({
          prompt,
          width: params.size,
          height: params.size,
          num_steps: params.steps,
        }),
      })

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`Cloudflare AI 官方 API 生圖失敗: ${res.status} — ${text.slice(0, 220)}`)
      }

      const ct = res.headers.get('content-type') ?? ''
      if (ct.includes('application/json')) {
        const j = (await res.json()) as { result?: { image?: string }; image?: string; mime?: string }
        const imgBase64 = j.result?.image || j.image
        if (!imgBase64) throw new Error('Cloudflare JSON response missing image')
        const mime = j.mime ?? 'image/png'
        return { dataUrl: `data:${mime};base64,${imgBase64}`, provider, prompt }
      }

      const buf = await res.arrayBuffer()
      const dataUrl = await dataUrlFromArrayBuffer(buf, 'image/png')
      return { dataUrl, provider, prompt }
    }

    if (!endpoint) {
      throw new Error('請填寫 Cloudflare Workers AI Endpoint，或者填寫 Account ID + Token 進行直接呼叫')
    }

    // 呼叫你的 Worker / Proxy
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'image/png,application/json',
    }
    if (token) headers.Authorization = `Bearer ${token}`

    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
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

  // 5. Leonardo.ai (支援 Direct API Key 或 Proxy Endpoint)
  const endpoint =
    params.secrets?.leonardoEndpoint || (import.meta.env.VITE_LEONARDO_ENDPOINT as string | undefined) || ''
  const apiKey = params.secrets?.leonardoApiKey || (import.meta.env.VITE_LEONARDO_API_KEY as string | undefined) || ''

  if (!endpoint && !apiKey) {
    throw new Error('請填寫 Leonardo API Key (直接連線) 或 Leonardo Endpoint')
  }

  const targetUrl = endpoint || 'https://cloud.leonardo.ai/api/rest/v1/generations'

  const res = await fetch(targetUrl, {
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
      num_inference_steps: params.steps,
      stylePreset: 'sticker',
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Leonardo error: ${res.status} ${res.statusText}${text ? ` — ${text.slice(0, 220)}` : ''}`)
  }

  const j = (await res.json()) as {
    image_url?: string
    image_base64?: string
    mime?: string
    sdGenerationJob?: { generationId?: string }
  }

  if (j.image_base64) {
    const mime = j.mime ?? 'image/png'
    return { dataUrl: `data:${mime};base64,${j.image_base64}`, provider, prompt }
  }
  if (j.image_url) {
    const imgRes = await fetch(j.image_url)
    if (!imgRes.ok) throw new Error('Leonardo image fetch failed')
    const buf = await imgRes.arrayBuffer()
    const mime = imgRes.headers.get('content-type') ?? 'image/png'
    const dataUrl = await dataUrlFromArrayBuffer(buf, mime)
    return { dataUrl, provider, prompt }
  }

  // 若為 Leonardo 官方非同步 API 回傳的 generationId，進行輪詢
  if (j.sdGenerationJob?.generationId) {
    const genId = j.sdGenerationJob.generationId
    for (let i = 0; i < 8; i++) {
      await new Promise((r) => setTimeout(r, 2500))
      const pollRes = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${genId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
      })
      if (pollRes.ok) {
        const pollJson = (await pollRes.json()) as {
          generations_by_pk?: { generated_images?: Array<{ url?: string }> }
        }
        const imgUrl = pollJson.generations_by_pk?.generated_images?.[0]?.url
        if (imgUrl) {
          try {
            const imgRes = await fetch(imgUrl)
            if (imgRes.ok) {
              const buf = await imgRes.arrayBuffer()
              const mime = imgRes.headers.get('content-type') ?? 'image/png'
              const dataUrl = await dataUrlFromArrayBuffer(buf, mime)
              return { dataUrl, provider, prompt }
            }
          } catch {
            return { dataUrl: imgUrl, provider, prompt }
          }
          return { dataUrl: imgUrl, provider, prompt }
        }
      }
    }
    throw new Error('Leonardo API 圖片生成逾時，請稍候重試')
  }

  throw new Error('Leonardo response missing image_url/image_base64')
}

