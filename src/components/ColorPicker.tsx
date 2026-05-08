import { Plus, Search, SlidersHorizontal, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { PantoneColor } from '../lib/pantone'
import { findPantone } from '../lib/pantone'
import { cmykToRgb, hexToRgb, rgbToCmyk, rgbToHex } from '../lib/color'
import { Button, FieldLabel, Input } from './ui'

type Mode = 'Pantone' | 'Custom'

export function ColorPicker(props: {
  colors: string[]
  pantoneCodes: string[]
  limit: number
  onChange: (next: { colors: string[]; pantoneCodes: string[] }) => void
}) {
  const [mode, setMode] = useState<Mode>('Pantone')
  const [query, setQuery] = useState('')
  const matches = useMemo(() => findPantone(query).slice(0, 10), [query])

  // custom add state
  const [customHex, setCustomHex] = useState('#FFFFFF')
  const rgb = useMemo(() => hexToRgb(customHex) ?? { r: 255, g: 255, b: 255 }, [customHex])
  const [cmyk, setCmyk] = useState(() => rgbToCmyk({ r: 255, g: 255, b: 255 }))

  function canAddMore() {
    return props.colors.length < props.limit
  }

  function addPantone(c: PantoneColor) {
    const idx = props.colors.findIndex((x) => x.toLowerCase() === c.hex.toLowerCase())
    if (idx >= 0) return
    if (!canAddMore()) return

    props.onChange({
      colors: [...props.colors, c.hex],
      pantoneCodes: [...props.pantoneCodes, c.code],
    })
  }

  function addCustom(hex: string, label: string) {
    const normalized = hex.startsWith('#') ? hex : `#${hex}`
    const idx = props.colors.findIndex((x) => x.toLowerCase() === normalized.toLowerCase())
    if (idx >= 0) return
    if (!canAddMore()) return

    props.onChange({
      colors: [...props.colors, normalized],
      pantoneCodes: [...props.pantoneCodes, label],
    })
  }

  function remove(i: number) {
    const nextColors = props.colors.slice()
    const nextPantone = props.pantoneCodes.slice()
    nextColors.splice(i, 1)
    nextPantone.splice(i, 1)
    props.onChange({ colors: nextColors, pantoneCodes: nextPantone })
  }

  function syncFromHex(nextHex: string) {
    setCustomHex(nextHex)
    const nextRgb = hexToRgb(nextHex)
    if (nextRgb) setCmyk(rgbToCmyk(nextRgb))
  }

  function syncFromCmyk(next: { c: number; m: number; y: number; k: number }) {
    setCmyk(next)
    const nextHex = rgbToHex(cmykToRgb(next))
    setCustomHex(nextHex)
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <FieldLabel>色彩方案 / Palette</FieldLabel>
          <div className="mt-1 text-xs text-white/60">已使用 {props.colors.length} / {props.limit} 色</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400" />
          <div className="text-xs text-white/60">即時預覽</div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setMode('Pantone')}
          className={
            'rounded-xl border px-3 py-2 text-sm font-semibold transition ' +
            (mode === 'Pantone'
              ? 'border-white/15 bg-white text-slate-900'
              : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10')
          }
        >
          Pantone
        </button>
        <button
          type="button"
          onClick={() => setMode('Custom')}
          className={
            'rounded-xl border px-3 py-2 text-sm font-semibold transition ' +
            (mode === 'Custom'
              ? 'border-white/15 bg-white text-slate-900'
              : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10')
          }
        >
          自訂 RGB / CMYK
        </button>
      </div>

      {mode === 'Pantone' ? (
        <>
          <div className="mt-3 flex items-center gap-2">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜尋 Pantone，例如 186, blue, gray..."
                className="pl-9"
              />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {matches.map((c) => {
              const disabled = !canAddMore()
              return (
                <button
                  key={c.code}
                  onClick={() => addPantone(c)}
                  className={
                    'flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2 text-left hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50'
                  }
                  disabled={disabled}
                  type="button"
                >
                  <span className="h-5 w-5 rounded-lg" style={{ background: c.hex }} />
                  <span className="min-w-0">
                    <div className="truncate text-xs font-semibold text-white">{c.code}</div>
                    <div className="truncate text-[11px] text-white/60">
                      {c.name} • {c.hex}
                    </div>
                  </span>
                  <span className="ml-auto">
                    <Plus className="h-4 w-4 text-white/60" />
                  </span>
                </button>
              )
            })}
          </div>
        </>
      ) : (
        <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-white/70">自訂色（RGB / CMYK / Hex）</div>
            <div className="flex items-center gap-2 text-[11px] text-white/50">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              會自動互相換算
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel>色盤</FieldLabel>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="color"
                  value={customHex}
                  onChange={(e) => syncFromHex(e.target.value)}
                  className="h-10 w-12 cursor-pointer rounded-xl border border-white/10 bg-white/5"
                  aria-label="color"
                />
                <div className="w-full">
                  <FieldLabel>Hex</FieldLabel>
                  <Input value={customHex} onChange={(e) => syncFromHex(e.target.value)} />
                </div>
              </div>
              <div className="mt-2 text-[11px] text-white/50">提示：印刷通常以 CMYK 溝通；刺繡/PVC 多用 Pantone 或實樣。</div>
            </div>

            <div>
              <FieldLabel>RGB</FieldLabel>
              <div className="mt-1 grid grid-cols-3 gap-2">
                <Input
                  type="number"
                  min={0}
                  max={255}
                  value={rgb.r}
                  onChange={(e) => {
                    const r = Number(e.target.value || 0)
                    syncFromHex(rgbToHex({ r, g: rgb.g, b: rgb.b }))
                  }}
                />
                <Input
                  type="number"
                  min={0}
                  max={255}
                  value={rgb.g}
                  onChange={(e) => {
                    const g = Number(e.target.value || 0)
                    syncFromHex(rgbToHex({ r: rgb.r, g, b: rgb.b }))
                  }}
                />
                <Input
                  type="number"
                  min={0}
                  max={255}
                  value={rgb.b}
                  onChange={(e) => {
                    const b = Number(e.target.value || 0)
                    syncFromHex(rgbToHex({ r: rgb.r, g: rgb.g, b }))
                  }}
                />
              </div>
              <div className="mt-1 text-[11px] text-white/45">順序：R / G / B (0-255)</div>
            </div>

            <div className="sm:col-span-2">
              <FieldLabel>CMYK</FieldLabel>
              <div className="mt-1 grid grid-cols-4 gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={cmyk.c}
                  onChange={(e) => syncFromCmyk({ ...cmyk, c: Number(e.target.value || 0) })}
                />
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={cmyk.m}
                  onChange={(e) => syncFromCmyk({ ...cmyk, m: Number(e.target.value || 0) })}
                />
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={cmyk.y}
                  onChange={(e) => syncFromCmyk({ ...cmyk, y: Number(e.target.value || 0) })}
                />
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={cmyk.k}
                  onChange={(e) => syncFromCmyk({ ...cmyk, k: Number(e.target.value || 0) })}
                />
              </div>
              <div className="mt-1 text-[11px] text-white/45">順序：C / M / Y / K (0-100)</div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => addCustom(customHex, `CUSTOM ${customHex}`)}
                  disabled={!canAddMore()}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  加入色票
                </button>
                <div className="text-xs text-white/50">會以 Hex 儲存，並在規格中保留 CUSTOM 標籤</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-white">已選色票</div>
          <Button
            variant="ghost"
            className="h-8 px-2"
            onClick={() => props.onChange({ colors: [], pantoneCodes: [] })}
            disabled={!props.colors.length}
            type="button"
          >
            清空
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {props.colors.map((hex, i) => (
            <div
              key={`${hex}-${i}`}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1"
            >
              <span className="h-4 w-4 rounded-full" style={{ background: hex }} />
              <div className="text-[11px] text-white/70">{props.pantoneCodes[i] ?? hex}</div>
              <button type="button" onClick={() => remove(i)} className="rounded-full p-1 hover:bg-white/10">
                <X className="h-3.5 w-3.5 text-white/70" />
              </button>
            </div>
          ))}
          {!props.colors.length ? <div className="text-xs text-white/50">尚未選擇顏色</div> : null}
        </div>
      </div>

      {props.colors.length >= props.limit ? (
        <div className="mt-3 rounded-xl border border-amber-300/20 bg-amber-400/10 p-3 text-xs text-amber-100">
          已達此工藝的色數上限（{props.limit} 色）。請移除顏色或切換工藝。
        </div>
      ) : null}
    </div>
  )
}
