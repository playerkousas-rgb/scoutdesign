import { Check, Copy, Download, FileImage, FileJson, FileText, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Project, ValidationIssue } from '../lib/models'
import {
  designToSVG,
  projectToCraftPrompt,
  projectToFlatPrompt,
  projectToJSON,
  projectToMarkdown,
} from '../lib/exporters'
import { exportFactoryPdf } from '../lib/pdf'
import { downloadBlob, exportDesignPNG, exportPrintReadyPNG } from '../lib/png'
import { Button, Card, Divider, Pill, SectionTitle } from './ui'

function severityTone(sev: ValidationIssue['severity']): 'red' | 'yellow' | 'blue' {
  if (sev === 'error') return 'red'
  if (sev === 'warning') return 'yellow'
  return 'blue'
}

function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function readAiImageFromLocalStorage(): string | undefined {
  try {
    const v = localStorage.getItem('sfd:last_ai_image')
    return v || undefined
  } catch {
    return undefined
  }
}

function CopyBtn({ text, label = '複製' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        })
      }}
      className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/10 px-2.5 py-1 text-xs font-medium text-white hover:bg-white/20"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-300" /> : <Copy className="h-3 w-3" />}
      {copied ? '已複製' : label}
    </button>
  )
}

export function PreviewPanel(props: { project: Project; issues: ValidationIssue[] }) {
  const md = useMemo(() => projectToMarkdown(props.project), [props.project])
  const json = useMemo(() => projectToJSON(props.project), [props.project])
  const flatPrompt = useMemo(() => projectToFlatPrompt(props.project), [props.project])
  const craftPrompt = useMemo(() => projectToCraftPrompt(props.project), [props.project])
  const svg = useMemo(() => designToSVG(props.project), [props.project])
  const [busy, setBusy] = useState<'pdf' | 'png' | null>(null)

  async function exportPdf() {
    setBusy('pdf')
    try {
      const ai = readAiImageFromLocalStorage()
      const blob = await exportFactoryPdf({
        project: props.project,
        flatSvg: svg,
        effectImageDataUrl: ai,
        pdfOptions: { dpi: 300, includeBleed: true, bleedMm: 3, title: 'factory-spec' },
      })
      downloadBlob(`factory-spec-${props.project.id.slice(0, 8)}.pdf`, blob)
    } finally {
      setBusy(null)
    }
  }

  async function exportPng() {
    setBusy('png')
    try {
      const blob = await exportDesignPNG(props.project, { width: 2400 })
      downloadBlob(`flat-design-${props.project.id.slice(0, 8)}.png`, blob)
    } finally {
      setBusy(null)
    }
  }

  async function exportPrintPng() {
    setBusy('png')
    try {
      const blob = await exportPrintReadyPNG(props.project)
      downloadBlob(`print-ready-${props.project.id.slice(0, 8)}.png`, blob)
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card className="sticky top-4 overflow-hidden">
      <div className="border-b border-white/10 p-4">
        <SectionTitle
          title="Real-time Preview"
          subtitle="輸入 → 校驗 → PROMPT (平面/工藝) / 規格書 / JSON / SVG 一鍵匯出"
        />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button onClick={() => downloadText('design-spec.md', md, 'text/markdown')}>
            <FileText className="h-4 w-4" />
            匯出 MD
          </Button>
          <Button variant="ghost" onClick={() => downloadText('design-data.json', json, 'application/json')}>
            <FileJson className="h-4 w-4" />
            匯出 JSON
          </Button>
          <Button
            variant="ghost"
            onClick={() => downloadText('ai-prompt-flat.txt', flatPrompt, 'text/plain')}
            className="text-cyan-200"
          >
            <Sparkles className="h-4 w-4 text-cyan-300" />
            🎨 平面 Prompt
          </Button>
          <Button
            variant="ghost"
            onClick={() => downloadText('ai-prompt-craft.txt', craftPrompt, 'text/plain')}
            className="text-amber-200"
          >
            <Sparkles className="h-4 w-4 text-amber-300" />
            ⚡ 工藝 Prompt
          </Button>
          <Button variant="ghost" onClick={exportPdf} disabled={busy === 'pdf'} className="col-span-2">
            <Download className="h-4 w-4" />
            {busy === 'pdf' ? 'PDF 產生中…' : 'PDF 規格包 (300DPI/出血/色版)'}
          </Button>
          <Button variant="ghost" onClick={exportPng} disabled={busy === 'png'} className="col-span-2">
            <FileImage className="h-4 w-4" />
            {busy === 'png' ? 'PNG 產生中…' : '匯出 PNG（平面設計圖，分享用）'}
          </Button>
          <Button variant="ghost" onClick={exportPrintPng} disabled={busy === 'png'} className="col-span-2">
            <FileImage className="h-4 w-4" />
            {busy === 'png' ? 'PNG 產生中…' : '匯出 PNG（量產用：成品+出血，300DPI）'}
          </Button>
        </div>
      </div>

      <div className="p-4">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="text-xs font-semibold text-white/70">Canvas/SVG Draft</div>
          <div className="mt-2 overflow-hidden rounded-xl border border-white/10 bg-[#0b1220]">
            <div className="aspect-[16/10] w-full" dangerouslySetInnerHTML={{ __html: svg }} />
          </div>
        </div>

        <Divider />

        <div>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-white">校驗結果</div>
            <div className="text-xs text-white/50">Hardcoded 工藝規則</div>
          </div>
          <div className="mt-2 space-y-2">
            {props.issues.length ? (
              props.issues.map((it) => (
                <div key={it.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">{it.title}</div>
                      <div className="mt-1 text-xs text-white/60">{it.detail}</div>
                      {it.rule ? <div className="mt-2 text-[11px] text-white/50">{it.rule}</div> : null}
                    </div>
                    <Pill tone={severityTone(it.severity)}>{it.severity.toUpperCase()}</Pill>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-3 text-sm text-emerald-100">
                全部通過。可直接發給工廠。
              </div>
            )}
          </div>
        </div>

        <Divider />

        <details className="group">
          <summary className="cursor-pointer select-none text-sm font-semibold text-white/80">
            查看 Prompt 提示詞與規格 (PROMPT 平面 / 工藝 / MD / JSON)
          </summary>
          <div className="mt-3 space-y-3">
            {/* 1. 平面設計稿 Prompt */}
            <div className="rounded-2xl border border-cyan-300/20 bg-black/20 p-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-cyan-200">🎨 PROMPT (平面) — 適合 2D 向量草圖、標誌設計</div>
                <CopyBtn text={flatPrompt} label="複製平面 Prompt" />
              </div>
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-xl border border-white/5 bg-[#0b1220] p-2 text-xs text-white/70">
                {flatPrompt}
              </pre>
            </div>

            {/* 2. 工藝效果圖 Prompt */}
            <div className="rounded-2xl border border-amber-300/20 bg-black/20 p-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-amber-200">⚡ PROMPT (工藝) — 適合模擬真實刺繡、浮雕與金屬鑄造</div>
                <CopyBtn text={craftPrompt} label="複製工藝 Prompt" />
              </div>
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-xl border border-white/5 bg-[#0b1220] p-2 text-xs text-white/70">
                {craftPrompt}
              </pre>
            </div>

            {/* 3. Markdown 規格書 */}
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-white/70">Markdown 規格書</div>
                <CopyBtn text={md} label="複製 Markdown" />
              </div>
              <pre className="mt-2 max-h-56 overflow-auto text-xs text-white/70">{md}</pre>
            </div>

            {/* 4. JSON 數據 */}
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-white/70">JSON 數據結構</div>
                <CopyBtn text={json} label="複製 JSON" />
              </div>
              <pre className="mt-2 max-h-56 overflow-auto text-xs text-white/70">{json}</pre>
            </div>
          </div>
        </details>
      </div>
    </Card>
  )
}

