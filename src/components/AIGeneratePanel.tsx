import { Download, Image as ImageIcon, Loader2, Sparkles } from 'lucide-react'
import { useState } from 'react'
import type { Project } from '../lib/models'
import type { AIProvider } from '../lib/aiProviders'
import { generateImage } from '../lib/aiProviders'
import { loadSecrets, saveSecrets } from '../lib/userSecrets'
import { Button, Card, Divider, FieldLabel, Input, SectionTitle, Select } from './ui'

type Provider = AIProvider | 'None'

export function AIGeneratePanel({ project }: { project: Project }) {
  const [provider, setProvider] = useState<Provider>('CloudflareWorkersAI')
  const [extra, setExtra] = useState('')
  const [size, setSize] = useState<'1024' | '768'>('768')
  const [steps, setSteps] = useState(25)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [secrets, setSecrets] = useState(() => loadSecrets())

  const [img, setImg] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string>('')

  const [lastPrompt, setLastPrompt] = useState('')

  async function run() {
    setErr('')
    setLoading(true)
    try {
      if (provider === 'None') throw new Error('No provider selected')

      const wh = size === '1024' ? 1024 : 768
      const res = await generateImage(provider, { project, extra, size: wh, steps, secrets })
      setLastPrompt(res.prompt)
      setImg(res.dataUrl)
      try {
        localStorage.setItem('sfd:last_ai_image', res.dataUrl)
        localStorage.setItem('sfd:last_ai_provider', res.provider)
      } catch {
        // ignore
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  function downloadPng() {
    if (!img) return
    const a = document.createElement('a')
    a.href = img
    a.download = `concept-${project.id.slice(0, 8)}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-white/10 p-4">
        <SectionTitle title="AI 即時生圖" subtitle="用你填的工藝/文字/色彩，自動組合 Prompt 並直接生成概念圖。" />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <FieldLabel>Provider</FieldLabel>
            <Select value={provider} onChange={(e) => setProvider(e.target.value as Provider)}>
              <option value="CloudflareWorkersAI">Cloudflare Workers AI (SDXL)</option>
              <option value="Leonardo">Leonardo.ai</option>
              <option value="None">(關閉)</option>
            </Select>
            <div className="mt-1 text-[11px] text-white/45">
              你將在 Vercel Environment Variables 填入 API 參數：
              <br />
              - Cloudflare: VITE_CF_WORKERS_AI_ENDPOINT, VITE_CF_WORKERS_AI_TOKEN
              <br />
              - Leonardo: VITE_LEONARDO_ENDPOINT, VITE_LEONARDO_API_KEY
            </div>

            <button
              type="button"
              onClick={() => setSettingsOpen((v) => !v)}
              className="mt-2 text-xs font-semibold text-white/70 underline decoration-white/20 underline-offset-4 hover:text-white"
            >
              {settingsOpen ? '隱藏 API 設定' : '使用者自填 API Key（可選）'}
            </button>
          </div>

          <div>
            <FieldLabel>輸出尺寸</FieldLabel>
            <Select value={size} onChange={(e) => setSize(e.target.value as '1024' | '768')}>
              <option value="768">768 × 768（較快）</option>
              <option value="1024">1024 × 1024（較慢）</option>
            </Select>
            <div className="mt-1 text-[11px] text-white/45">步數越高越細緻，但更慢</div>
          </div>

          <div className="sm:col-span-2">
            <FieldLabel>額外要求（可選）</FieldLabel>
            <Input value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="例如：badge in shield shape, bold fleur-de-lis, no gradients" />
          </div>

          <div>
            <FieldLabel>Steps</FieldLabel>
            <Input type="number" min={10} max={50} value={steps} onChange={(e) => setSteps(Number(e.target.value || 25))} />
          </div>

          <div className="flex items-end">
            <Button onClick={run} disabled={loading || provider === 'None'} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              立即生成
            </Button>
          </div>
        </div>

        {settingsOpen ? (
          <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3">
            <div className="text-xs font-semibold text-white/70">API 設定（儲存在此瀏覽器 LocalStorage）</div>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2 text-[11px] text-white/50">
                用戶可自行填入 endpoint/token。若留空，系統會改用 Vercel 環境變數。
              </div>
              <div>
                <FieldLabel>Cloudflare Endpoint</FieldLabel>
                <Input
                  value={secrets.cfEndpoint}
                  onChange={(e) => {
                    const next = { ...secrets, cfEndpoint: e.target.value }
                    setSecrets(next)
                    saveSecrets(next)
                  }}
                  placeholder="https://your-worker.yourdomain.workers.dev"
                />
              </div>
              <div>
                <FieldLabel>Cloudflare Token</FieldLabel>
                <Input
                  value={secrets.cfToken}
                  onChange={(e) => {
                    const next = { ...secrets, cfToken: e.target.value }
                    setSecrets(next)
                    saveSecrets(next)
                  }}
                  placeholder="Bearer token"
                />
              </div>
              <div>
                <FieldLabel>Leonardo Endpoint</FieldLabel>
                <Input
                  value={secrets.leonardoEndpoint}
                  onChange={(e) => {
                    const next = { ...secrets, leonardoEndpoint: e.target.value }
                    setSecrets(next)
                    saveSecrets(next)
                  }}
                  placeholder="https://your-api.example.com/leonardo/generate"
                />
              </div>
              <div>
                <FieldLabel>Leonardo API Key</FieldLabel>
                <Input
                  value={secrets.leonardoApiKey}
                  onChange={(e) => {
                    const next = { ...secrets, leonardoApiKey: e.target.value }
                    setSecrets(next)
                    saveSecrets(next)
                  }}
                  placeholder="api key"
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="p-4">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-white/70">Generated Image</div>
            <div className="text-[11px] text-white/50">概念圖（非工廠打樣），請以規格書為準</div>
          </div>
          <div className="mt-2 overflow-hidden rounded-xl border border-white/10 bg-[#0b1220]">
            {img ? (
              <img src={img} alt="ai-generated" className="aspect-square w-full object-cover" />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center text-white/35">
                <div className="flex items-center gap-2 text-sm">
                  <ImageIcon className="h-4 w-4" />
                  尚未生成
                </div>
              </div>
            )}
          </div>
          {err ? (
            <div className="mt-3 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-xs text-rose-100">
              {err}
            </div>
          ) : null}

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button variant="ghost" onClick={downloadPng} disabled={!img}>
              <Download className="h-4 w-4" />
              匯出 PNG（分享用）
            </Button>
            <div className="text-[11px] text-white/45 sm:text-right">
              PNG 僅供社群討論；工廠請以 PDF/規格書為準
            </div>
          </div>
        </div>

        <Divider />

        <details>
          <summary className="cursor-pointer select-none text-sm font-semibold text-white/80">查看送出的 Prompt</summary>
          <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/20 p-3 text-xs text-white/70">
{lastPrompt || '(尚未生成)'}
          </pre>
        </details>
      </div>
    </Card>
  )
}
