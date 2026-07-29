import { Check, Copy, Download, Image as ImageIcon, Key, Loader2, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Project } from '../lib/models'
import type { AIProvider } from '../lib/aiProviders'
import { buildPrompt, generateImage } from '../lib/aiProviders'
import { loadSecrets, saveSecrets } from '../lib/userSecrets'
import { Button, Card, Divider, FieldLabel, Input, Pill, SectionTitle, Select } from './ui'

type Provider = AIProvider | 'None'

export function AIGeneratePanel({ project }: { project: Project }) {
  const [provider, setProvider] = useState<Provider>('OpenAI_DALLE3')
  const [promptMode, setPromptMode] = useState<'craft' | 'flat'>('craft')
  const [extra, setExtra] = useState('')
  const [size, setSize] = useState<'1024' | '768'>('1024')
  const [steps, setSteps] = useState(25)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [secrets, setSecrets] = useState(() => loadSecrets())

  const [img, setImg] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string>('')
  const [copied, setCopied] = useState(false)

  const [lastPrompt, setLastPrompt] = useState('')

  // 即時預覽即將送出的提示詞
  const livePrompt = useMemo(() => {
    return buildPrompt(project, extra, promptMode)
  }, [project, extra, promptMode])

  // 判斷當前 Provider 是否已設定足夠的 API Key / Endpoint
  const isProviderReady = useMemo(() => {
    if (provider === 'OpenAI_DALLE3') return Boolean(secrets.openaiApiKey)
    if (provider === 'TogetherAI') return Boolean(secrets.togetherApiKey)
    if (provider === 'Gemini_Imagen') return Boolean(secrets.geminiApiKey)
    if (provider === 'CloudflareWorkersAI') {
      return Boolean(secrets.cfEndpoint || (secrets.cfAccountId && secrets.cfToken))
    }
    if (provider === 'Leonardo') {
      return Boolean(secrets.leonardoApiKey || secrets.leonardoEndpoint)
    }
    return true
  }, [provider, secrets])

  function copyPrompt(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function run() {
    setErr('')
    setLoading(true)
    try {
      if (provider === 'None') throw new Error('未選擇任何 Provider')
      if (!isProviderReady) {
        setSettingsOpen(true)
        throw new Error('請先填入對應的 API Key 即可調用生圖')
      }

      const wh = size === '1024' ? 1024 : 768
      const res = await generateImage(provider, {
        project,
        extra,
        size: wh,
        steps,
        promptMode,
        secrets,
      })
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
    a.download = `concept-${promptMode}-${project.id.slice(0, 8)}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  function clearAllSecrets() {
    const empty = {
      cfEndpoint: '',
      cfToken: '',
      cfAccountId: '',
      leonardoEndpoint: '',
      leonardoApiKey: '',
      openaiApiKey: '',
      openaiBaseUrl: '',
      togetherApiKey: '',
      geminiApiKey: '',
    }
    setSecrets(empty)
    saveSecrets(empty)
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-white/10 p-4">
        <SectionTitle
          title="AI 即時生圖 (支援 PROMPT 平面 / 工藝 雙模式)"
          subtitle="可一鍵切換「平面設計稿」與「工藝效果圖」Prompt，並直接綁定 API Key 一鍵生成。"
        />

        {/* Prompt 模式切換鈕 */}
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-black/20 p-2">
          <div className="text-xs font-semibold text-white/70">Prompt 模式：</div>
          <button
            type="button"
            onClick={() => setPromptMode('craft')}
            className={
              'rounded-xl px-3 py-1.5 text-xs font-semibold transition ' +
              (promptMode === 'craft'
                ? 'bg-amber-400 text-slate-900 shadow-md'
                : 'text-white/70 hover:bg-white/10')
            }
          >
            ⚡ 工藝效果圖 Prompt (Craft 3D / Production)
          </button>
          <button
            type="button"
            onClick={() => setPromptMode('flat')}
            className={
              'rounded-xl px-3 py-1.5 text-xs font-semibold transition ' +
              (promptMode === 'flat'
                ? 'bg-cyan-400 text-slate-900 shadow-md'
                : 'text-white/70 hover:bg-white/10')
            }
          >
            🎨 平面設計稿 Prompt (Flat 2D / Graphic)
          </button>
          <div className="ml-auto text-[11px] text-white/50">
            {promptMode === 'craft'
              ? '模擬工藝縫線、立體浮雕與金屬鑄造光澤'
              : '呈現平視向量輪廓、無背景雜訊、適合作為平面草圖'}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <div className="flex items-center justify-between">
              <FieldLabel>AI Provider (可直接連接 API Key)</FieldLabel>
              {provider !== 'None' ? (
                isProviderReady ? (
                  <Pill tone="emerald">✓ API Key 已綁定</Pill>
                ) : (
                  <Pill tone="yellow">⚠ 待填寫 API Key</Pill>
                )
              ) : null}
            </div>
            <Select value={provider} onChange={(e) => setProvider(e.target.value as Provider)}>
              <option value="OpenAI_DALLE3">OpenAI DALL·E 3 (直接連接 API Key) ⭐</option>
              <option value="TogetherAI">Together AI / FLUX.1 (直接連接 API Key) ⚡</option>
              <option value="Gemini_Imagen">Google Gemini Imagen 3 (直接連接 API Key)</option>
              <option value="CloudflareWorkersAI">Cloudflare Workers AI (SDXL / FLUX)</option>
              <option value="Leonardo">Leonardo.ai</option>
              <option value="None">(關閉)</option>
            </Select>
            <div className="mt-1 flex items-center justify-between text-[11px] text-white/55">
              <span>不需伺服器後端，瀏覽器端即可直連官方 API 生圖。</span>
              <button
                type="button"
                onClick={() => setSettingsOpen((v) => !v)}
                className="flex items-center gap-1 font-semibold text-amber-300 hover:underline"
              >
                <Key className="h-3 w-3" />
                {settingsOpen ? '隱藏 API 設定' : '設定 / 填寫 API Key'}
              </button>
            </div>
          </div>

          <div>
            <FieldLabel>輸出尺寸</FieldLabel>
            <Select value={size} onChange={(e) => setSize(e.target.value as '1024' | '768')}>
              <option value="1024">1024 × 1024（標準高畫質）</option>
              <option value="768">768 × 768（較慢速度較快）</option>
            </Select>
            <div className="mt-1 text-[11px] text-white/45">DALL-E 3 與 FLUX 建議用 1024×1024</div>
          </div>

          <div className="sm:col-span-2">
            <FieldLabel>額外要求（可選 Extra constraints）</FieldLabel>
            <Input
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              placeholder="例如：badge in shield shape, bold fleur-de-lis, no gradients, vintage style"
            />
          </div>

          <div>
            <FieldLabel>Steps (對 SDXL / Leonardo 適用)</FieldLabel>
            <Input
              type="number"
              min={4}
              max={50}
              value={steps}
              onChange={(e) => setSteps(Number(e.target.value || 25))}
            />
            <div className="mt-1 text-[11px] text-white/45">FLUX-schnell 預設 4 步；SDXL 建議 25 步</div>
          </div>

          <div className="flex items-end">
            <Button onClick={run} disabled={loading || provider === 'None'} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? 'AI 生圖中...' : `立即生成 (${promptMode === 'craft' ? '工藝效果圖' : '平面設計稿'})`}
            </Button>
          </div>
        </div>

        {/* 即時 Prompt 預覽框 */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-white/80">
              即將送出的 Prompt 預覽 ({promptMode === 'craft' ? '工藝 PROMPT' : '平面 PROMPT'})
            </div>
            <button
              type="button"
              onClick={() => copyPrompt(livePrompt)}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/10 px-2.5 py-1 text-xs font-medium text-white hover:bg-white/20"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? '已複製！' : '複製此 Prompt'}
            </button>
          </div>
          <pre className="mt-2 max-h-36 overflow-auto whitespace-pre-wrap rounded-xl border border-white/5 bg-[#0b1220] p-2.5 text-xs text-white/70">
            {livePrompt}
          </pre>
        </div>

        {settingsOpen ? (
          <div className="mt-3 rounded-2xl border border-amber-300/30 bg-black/40 p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-white">🔑 直接連接 API Key 設定 (自動儲存於 LocalStorage)</div>
              <button
                type="button"
                onClick={clearAllSecrets}
                className="text-xs text-rose-300 underline hover:text-rose-200"
              >
                清除所有已保存 Key
              </button>
            </div>
            <div className="mt-1 text-xs text-white/60">
              您可以直接輸入以下任一 Provider 的 API Key；所有 Token 僅儲存於您的瀏覽器端，不會外流。
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* OpenAI DALL-E 3 */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 sm:col-span-2">
                <div className="text-xs font-semibold text-emerald-300">OpenAI DALL·E 3 API Key (推薦)</div>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <FieldLabel>OpenAI API Key</FieldLabel>
                    <Input
                      type="password"
                      value={secrets.openaiApiKey}
                      onChange={(e) => {
                        const next = { ...secrets, openaiApiKey: e.target.value }
                        setSecrets(next)
                        saveSecrets(next)
                      }}
                      placeholder="sk-..."
                    />
                  </div>
                  <div>
                    <FieldLabel>OpenAI Base URL (可選，中轉或自建適用)</FieldLabel>
                    <Input
                      value={secrets.openaiBaseUrl}
                      onChange={(e) => {
                        const next = { ...secrets, openaiBaseUrl: e.target.value }
                        setSecrets(next)
                        saveSecrets(next)
                      }}
                      placeholder="https://api.openai.com/v1"
                    />
                  </div>
                </div>
              </div>

              {/* Together AI */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 sm:col-span-2">
                <div className="text-xs font-semibold text-cyan-300">Together AI (FLUX.1-schnell 極速生圖)</div>
                <div className="mt-2">
                  <FieldLabel>Together AI API Key</FieldLabel>
                  <Input
                    type="password"
                    value={secrets.togetherApiKey}
                    onChange={(e) => {
                      const next = { ...secrets, togetherApiKey: e.target.value }
                      setSecrets(next)
                      saveSecrets(next)
                    }}
                    placeholder="輸入 API Key..."
                  />
                </div>
              </div>

              {/* Google Gemini */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 sm:col-span-2">
                <div className="text-xs font-semibold text-purple-300">Google Gemini Imagen 3 (免費 API Key)</div>
                <div className="mt-2">
                  <FieldLabel>Google Gemini API Key</FieldLabel>
                  <Input
                    type="password"
                    value={secrets.geminiApiKey}
                    onChange={(e) => {
                      const next = { ...secrets, geminiApiKey: e.target.value }
                      setSecrets(next)
                      saveSecrets(next)
                    }}
                    placeholder="AIzaSy..."
                  />
                </div>
              </div>

              {/* Cloudflare Workers AI */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 sm:col-span-2">
                <div className="text-xs font-semibold text-amber-300">Cloudflare Workers AI</div>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Cloudflare Account ID (官方直接 API 必填)</FieldLabel>
                    <Input
                      value={secrets.cfAccountId || ''}
                      onChange={(e) => {
                        const next = { ...secrets, cfAccountId: e.target.value }
                        setSecrets(next)
                        saveSecrets(next)
                      }}
                      placeholder="例如：a1b2c3d4e5f6..."
                    />
                  </div>
                  <div>
                    <FieldLabel>Cloudflare API Token</FieldLabel>
                    <Input
                      type="password"
                      value={secrets.cfToken}
                      onChange={(e) => {
                        const next = { ...secrets, cfToken: e.target.value }
                        setSecrets(next)
                        saveSecrets(next)
                      }}
                      placeholder="Token..."
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel>或填寫代理 Endpoint (可選)</FieldLabel>
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
                </div>
              </div>

              {/* Leonardo */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 sm:col-span-2">
                <div className="text-xs font-semibold text-pink-300">Leonardo.ai</div>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Leonardo API Key (直接調用)</FieldLabel>
                    <Input
                      type="password"
                      value={secrets.leonardoApiKey}
                      onChange={(e) => {
                        const next = { ...secrets, leonardoApiKey: e.target.value }
                        setSecrets(next)
                        saveSecrets(next)
                      }}
                      placeholder="leonardo api key..."
                    />
                  </div>
                  <div>
                    <FieldLabel>Leonardo 代理 Endpoint (可選)</FieldLabel>
                    <Input
                      value={secrets.leonardoEndpoint}
                      onChange={(e) => {
                        const next = { ...secrets, leonardoEndpoint: e.target.value }
                        setSecrets(next)
                        saveSecrets(next)
                      }}
                      placeholder="https://your-proxy.com/leonardo/generate"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="p-4">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-xs font-semibold text-white/80">AI 生成結果 ({promptMode === 'craft' ? '⚡ 工藝效果圖' : '🎨 平面設計稿'})</div>
              <Pill tone={promptMode === 'craft' ? 'yellow' : 'blue'}>
                {promptMode === 'craft' ? 'CRAFT MODE' : 'FLAT MODE'}
              </Pill>
            </div>
            <div className="text-[11px] text-white/50">概念圖僅供討論與視覺溝通，量產請以 PDF 規格為準</div>
          </div>
          <div className="mt-2 overflow-hidden rounded-xl border border-white/10 bg-[#0b1220]">
            {img ? (
              <img src={img} alt="ai-generated" className="aspect-square w-full object-cover" />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center text-white/35">
                <div className="flex flex-col items-center gap-2 text-sm">
                  <ImageIcon className="h-6 w-6 text-white/20" />
                  <span>尚未生成 ({promptMode === 'craft' ? '工藝模擬' : '平面設計'})</span>
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
              匯出 PNG（分享用 {promptMode === 'craft' ? '工藝圖' : '平面圖'}）
            </Button>
            <div className="text-[11px] text-white/45 sm:text-right">
              已支援 PROMPT 雙模式匯出與一鍵生圖
            </div>
          </div>
        </div>

        <Divider />

        <details>
          <summary className="cursor-pointer select-none text-sm font-semibold text-white/80">
            查看最後一次送出的 Prompt
          </summary>
          <div className="mt-3 relative">
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/20 p-3 text-xs text-white/70">
              {lastPrompt || '(尚未生成)'}
            </pre>
            {lastPrompt ? (
              <button
                type="button"
                onClick={() => copyPrompt(lastPrompt)}
                className="absolute top-2 right-2 flex items-center gap-1 rounded border border-white/10 bg-white/10 px-2 py-1 text-[11px] text-white hover:bg-white/20"
              >
                {copied ? '✓ 已複製' : '複製'}
              </button>
            ) : null}
          </div>
        </details>
      </div>
    </Card>
  )
}

