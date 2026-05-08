import { AlertTriangle, BadgeCheck, ChevronRight, Layers, Scissors, Shirt } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ColorPicker } from '../components/ColorPicker'
import { AIGeneratePanel } from '../components/AIGeneratePanel'
import { PreviewPanel } from '../components/PreviewPanel'
import { Button, Card, Divider, FadeIn, FieldLabel, Input, SectionTitle, Select, Textarea } from '../components/ui'
import type { BadgeDesign, Project, ProjectType, ValidationIssue, WoggleDesign } from '../lib/models'
import { makeDefaultProject } from '../lib/models'
import { processColorLimit, validateProject } from '../lib/rules'

function IssueBanner({ issues }: { issues: ValidationIssue[] }) {
  const errors = issues.filter((x) => x.severity === 'error').length
  const warnings = issues.filter((x) => x.severity === 'warning').length
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <BadgeCheck className="h-4 w-4 text-emerald-300" />
        即時校驗
      </div>
      <div className="text-xs text-white/60">Errors: {errors} • Warnings: {warnings}</div>
      {errors ? (
        <div className="ml-auto flex items-center gap-2 text-xs text-rose-200">
          <AlertTriangle className="h-4 w-4" />
          尚有錯誤，無法直接量產
        </div>
      ) : (
        <div className="ml-auto text-xs text-emerald-200">可生產（仍建議檢查警告）</div>
      )}
    </div>
  )
}

function Tabs({ value, onChange }: { value: ProjectType; onChange: (t: ProjectType) => void }) {
  return (
    <div className="grid grid-cols-2 rounded-2xl border border-white/10 bg-white/5 p-1">
      <button
        type="button"
        onClick={() => onChange('Badge')}
        className={
          'flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ' +
          (value === 'Badge' ? 'bg-white text-slate-900' : 'text-white/70 hover:bg-white/10')
        }
      >
        <Shirt className="h-4 w-4" />
        紀念章
      </button>
      <button
        type="button"
        onClick={() => onChange('Woggle')}
        className={
          'flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ' +
          (value === 'Woggle' ? 'bg-white text-slate-900' : 'text-white/70 hover:bg-white/10')
        }
      >
        <Layers className="h-4 w-4" />
        巾圈
      </button>
    </div>
  )
}

function MultiBoardHint() {
  return (
    <div className="rounded-2xl border border-sky-300/20 bg-sky-400/10 p-3 text-xs text-sky-100">
      併合章已啟用多畫板模式：建議拆分為 A/B/C 子章，並保持邊緣輪廓互相咬合。系統會自動預留 0.5mm 公差。
    </div>
  )
}

function ProcessWarning() {
  return (
    <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-3 text-xs text-amber-100">
      刺繡 + 鏤空屬於高風險組合：請確保支撐結構足夠（≥ 3mm），並避免細線與孤島區域。
    </div>
  )
}

export default function Designer() {
  const [project, setProject] = useState<Project>(() => makeDefaultProject())
  const issues = useMemo(() => validateProject(project), [project])

  function touch(next: Project) {
    setProject({ ...next, updated_at: new Date().toISOString() })
  }

  function setType(t: ProjectType) {
    touch({ ...project, type: t })
  }

  const badge = project.badge as BadgeDesign
  const woggle = project.woggle as WoggleDesign

  // Dynamic highlight for “cut-out” when embroidered is selected.
  const cutoutSuggested = project.type === 'Badge' && badge.tech_specs.process === 'Embroidered'

  const colorLimit =
    project.type === 'Badge' ? processColorLimit(badge.tech_specs.process) : woggle.tech_specs.dimension === '2D' ? 6 : 3

  return (
    <div>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
        <Card className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-white">Scout Factory Designer</h1>
              <p className="mt-1 text-sm text-white/60">引導式設計：把工藝規範寫進 UI，讓新手也能做出可量產的設計。</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden text-xs text-white/50 sm:block">Project</div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80">
                {project.id.slice(0, 8)}
              </div>
            </div>
          </div>

          <Divider />

          <SectionTitle title="🛑 模組一：項目初始化" subtitle="選擇設計類型後，系統會載入對應工藝約束與數據模型。" />
          <Tabs value={project.type} onChange={setType} />

          <div className="mt-4">
            <IssueBanner issues={issues} />
          </div>
        </Card>

        {project.type === 'Badge' ? (
          <FadeIn>
            <Card className="p-4">
              <SectionTitle title="🎖 模組二：紀念章設計 (Badge Architect)" subtitle="結構、內容、色彩與工藝引擎。" />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <FieldLabel>結構 (Structure)</FieldLabel>
                  <Select
                    value={badge.structure}
                    onChange={(e) => {
                      const structure = e.target.value as BadgeDesign['structure']
                      const next = { ...badge, structure }
                      if (structure === 'Puzzle') next.tech_specs = { ...next.tech_specs, assembly_tolerance_mm: 0.5 }
                      else next.tech_specs = { ...next.tech_specs, assembly_tolerance_mm: 0 }
                      touch({ ...project, badge: next })
                    }}
                  >
                    <option value="Single">單枚章</option>
                    <option value="Set">套章 (Set)</option>
                    <option value="Puzzle">併合章 (Puzzle)</option>
                  </Select>
                </div>

                <div>
                  <FieldLabel>工藝 (Process)</FieldLabel>
                  <Select
                    value={badge.tech_specs.process}
                    onChange={(e) => {
                      const process = e.target.value as BadgeDesign['tech_specs']['process']
                      const next = {
                        ...badge,
                        tech_specs: {
                          ...badge.tech_specs,
                          process,
                          embroidery_3d: process === 'Embroidered' ? badge.tech_specs.embroidery_3d : false,
                        },
                      }
                      touch({ ...project, badge: next })
                    }}
                  >
                    <option value="Embroidered">刺繡</option>
                    <option value="Woven">織嘜</option>
                    <option value="HeatTransfer">熱轉印</option>
                    <option value="PVC">PVC 軟膠</option>
                  </Select>
                  <div className="mt-1 text-[11px] text-white/45">刺繡 &lt; 9 色；PVC 建議簡化形狀</div>
                </div>
              </div>

              {badge.structure === 'Puzzle' ? <div className="mt-3"><MultiBoardHint /></div> : null}

              <Divider />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <FieldLabel>主題 (Theme)</FieldLabel>
                  <Input value={badge.theme} onChange={(e) => touch({ ...project, badge: { ...badge, theme: e.target.value } })} placeholder="例：2026 露營大會、山岳探索..." />
                </div>
                <div>
                  <FieldLabel>設計風格描述 (Style notes)</FieldLabel>
                  <Input
                    value={badge.style_notes}
                    onChange={(e) => touch({ ...project, badge: { ...badge, style_notes: e.target.value } })}
                    placeholder="例：極簡現代、幾何、戶外徽章風..."
                  />
                </div>

                <div>
                  <FieldLabel>中文文字</FieldLabel>
                  <Input
                    value={badge.elements.text_zh}
                    onChange={(e) => touch({ ...project, badge: { ...badge, elements: { ...badge.elements, text_zh: e.target.value } } })}
                    placeholder="例：中華民國童軍"
                  />
                </div>

                <div>
                  <FieldLabel>英文文字</FieldLabel>
                  <Input
                    value={badge.elements.text_en}
                    onChange={(e) => touch({ ...project, badge: { ...badge, elements: { ...badge.elements, text_en: e.target.value } } })}
                    placeholder="例：Scouts of China"
                  />
                </div>

                <div>
                  <FieldLabel>文字高度 (mm)</FieldLabel>
                  <Input
                    type="number"
                    min={1}
                    step={0.1}
                    value={badge.elements.text_height_mm}
                    onChange={(e) =>
                      touch({
                        ...project,
                        badge: { ...badge, elements: { ...badge.elements, text_height_mm: Number(e.target.value || 0) } },
                      })
                    }
                  />
                  <div className="mt-1 text-[11px] text-white/45">[Rule 01] 刺繡時 &lt; 4mm 會觸發模糊警告</div>
                </div>

                <div>
                  <FieldLabel>黑名單 (逗號分隔)</FieldLabel>
                  <Input
                    value={badge.elements.forbidden_items.join(', ')}
                    onChange={(e) =>
                      touch({
                        ...project,
                        badge: {
                          ...badge,
                          elements: {
                            ...badge.elements,
                            forbidden_items: e.target.value
                              .split(',')
                              .map((x) => x.trim())
                              .filter(Boolean),
                          },
                        },
                      })
                    }
                    placeholder="例：卍, 18+, XXX"
                  />
                </div>
              </div>

              <Divider />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <FieldLabel>特殊工藝</FieldLabel>
                        <div className="mt-1 text-xs text-white/60">依工藝可用性自動限制</div>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      <label className={
                        'flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-2 text-sm ' +
                        (cutoutSuggested
                          ? 'border-amber-300/30 bg-amber-400/10'
                          : 'border-white/10 bg-white/5 hover:bg-white/10')
                      }>
                        <div className="flex items-center gap-2">
                          <Scissors className={
                            'h-4 w-4 ' + (cutoutSuggested ? 'text-amber-200' : 'text-white/60')
                          } />
                          <div className="text-white/80">鏤空 (Cut-out)</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={badge.tech_specs.hollow_out}
                          onChange={(e) =>
                            touch({
                              ...project,
                              badge: { ...badge, tech_specs: { ...badge.tech_specs, hollow_out: e.target.checked } },
                            })
                          }
                        />
                      </label>

                      {badge.tech_specs.process === 'Embroidered' ? (
                        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-2 text-sm hover:bg-white/10">
                          <div className="flex items-center gap-2">
                            <ChevronRight className="h-4 w-4 text-white/60" />
                            <div className="text-white/80">3D 立體刺繡</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={badge.tech_specs.embroidery_3d}
                            onChange={(e) =>
                              touch({
                                ...project,
                                badge: { ...badge, tech_specs: { ...badge.tech_specs, embroidery_3d: e.target.checked } },
                              })
                            }
                          />
                        </label>
                      ) : (
                        <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-xs text-white/50">
                          3D 立體刺繡僅在「刺繡」工藝可用。
                        </div>
                      )}

                      {cutoutSuggested ? <ProcessWarning /> : null}

                      {badge.tech_specs.hollow_out ? (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                          <FieldLabel>支撐結構寬度 (mm)</FieldLabel>
                          <Input
                            type="number"
                            min={0}
                            step={0.1}
                            value={badge.tech_specs.support_width_mm}
                            onChange={(e) =>
                              touch({
                                ...project,
                                badge: {
                                  ...badge,
                                  tech_specs: { ...badge.tech_specs, support_width_mm: Number(e.target.value || 0) },
                                },
                              })
                            }
                          />
                          <div className="mt-1 text-[11px] text-white/45">[Rule 02] 刺繡 Cut-out 支撐 ≥ 3mm</div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <ColorPicker
                    colors={badge.tech_specs.colors}
                    pantoneCodes={badge.tech_specs.pantone_codes}
                    limit={colorLimit}
                    onChange={(next) =>
                      touch({
                        ...project,
                        badge: { ...badge, tech_specs: { ...badge.tech_specs, colors: next.colors, pantone_codes: next.pantoneCodes } },
                      })
                    }
                  />
                </div>

                <div>
                  <FieldLabel>多畫板內容（Puzzle 建議）</FieldLabel>
                  <Textarea
                    rows={14}
                    value={badge.structure === 'Puzzle' ? '畫板 A：主圖 + EN\n畫板 B：副圖 + ZH\n畫板 C：年份/地點 (可選)' : '單畫板：主圖 + 文字'}
                    readOnly
                  />
                  <div className="mt-2 text-xs text-white/45">此處為指引說明；實務可延伸為多 Canvas 編輯。</div>
                </div>
              </div>
            </Card>
          </FadeIn>
        ) : (
          <FadeIn>
            <Card className="p-4">
              <SectionTitle title="🧣 模組三：巾圈設計 (Woggle Lab)" subtitle="2D/3D 分流，並硬性鎖定物理規格。" />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <FieldLabel>維度</FieldLabel>
                  <Select
                    value={woggle.tech_specs.dimension}
                    onChange={(e) =>
                      touch({
                        ...project,
                        woggle: {
                          ...woggle,
                          tech_specs: {
                            ...woggle.tech_specs,
                            dimension: e.target.value as WoggleDesign['tech_specs']['dimension'],
                          },
                        },
                      })
                    }
                  >
                    <option value="2D">2D 平面</option>
                    <option value="3D">3D 立體</option>
                  </Select>
                </div>

                <div>
                  <FieldLabel>內徑 (mm) — 鎖定</FieldLabel>
                  <Input value={30} readOnly />
                  <div className="mt-1 text-[11px] text-white/45">規範：內徑必須為 30mm（便於領巾穿過）</div>
                </div>
              </div>

              <Divider />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <FieldLabel>主題 (Theme)</FieldLabel>
                  <Input value={woggle.theme} onChange={(e) => touch({ ...project, woggle: { ...woggle, theme: e.target.value } })} placeholder="例：海洋探索、和平服務..." />
                </div>
                <div>
                  <FieldLabel>設計風格描述 (Style notes)</FieldLabel>
                  <Input
                    value={woggle.style_notes}
                    onChange={(e) => touch({ ...project, woggle: { ...woggle, style_notes: e.target.value } })}
                    placeholder="例：金屬雕刻、皮革壓印、圓角安全..."
                  />
                </div>

                <div>
                  <FieldLabel>中文文字</FieldLabel>
                  <Input
                    value={woggle.elements.text_zh}
                    onChange={(e) => touch({ ...project, woggle: { ...woggle, elements: { ...woggle.elements, text_zh: e.target.value } } })}
                  />
                </div>
                <div>
                  <FieldLabel>英文文字</FieldLabel>
                  <Input
                    value={woggle.elements.text_en}
                    onChange={(e) => touch({ ...project, woggle: { ...woggle, elements: { ...woggle.elements, text_en: e.target.value } } })}
                  />
                </div>

                <div>
                  <FieldLabel>文字高度 (mm)</FieldLabel>
                  <Input
                    type="number"
                    min={1}
                    step={0.1}
                    value={woggle.elements.text_height_mm}
                    onChange={(e) =>
                      touch({
                        ...project,
                        woggle: { ...woggle, elements: { ...woggle.elements, text_height_mm: Number(e.target.value || 0) } },
                      })
                    }
                  />
                </div>

                <div>
                  <FieldLabel>黑名單 (逗號分隔)</FieldLabel>
                  <Input
                    value={woggle.elements.forbidden_items.join(', ')}
                    onChange={(e) =>
                      touch({
                        ...project,
                        woggle: {
                          ...woggle,
                          elements: {
                            ...woggle.elements,
                            forbidden_items: e.target.value
                              .split(',')
                              .map((x) => x.trim())
                              .filter(Boolean),
                          },
                        },
                      })
                    }
                  />
                </div>
              </div>

              <Divider />

              {woggle.tech_specs.dimension === '2D' ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <FieldLabel>材質 (2D)</FieldLabel>
                    <Select
                      value={woggle.tech_specs.material_2d}
                      onChange={(e) =>
                        touch({
                          ...project,
                          woggle: {
                            ...woggle,
                            tech_specs: { ...woggle.tech_specs, material_2d: e.target.value as WoggleDesign['tech_specs']['material_2d'] },
                          },
                        })
                      }
                    >
                      <option value="Leather">皮革</option>
                      <option value="Metal">金屬</option>
                      <option value="PVC">PVC</option>
                    </Select>
                  </div>
                  <div>
                    <FieldLabel>銳角邊緣檢測</FieldLabel>
                    <label className="mt-1 flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/5 p-2 text-sm hover:bg-white/10">
                      <div className="text-white/80">存在銳角/割手風險</div>
                      <input
                        type="checkbox"
                        checked={woggle.tech_specs.has_sharp_edges}
                        onChange={(e) =>
                          touch({
                            ...project,
                            woggle: { ...woggle, tech_specs: { ...woggle.tech_specs, has_sharp_edges: e.target.checked } },
                          })
                        }
                      />
                    </label>
                    <div className="mt-1 text-[11px] text-white/45">若有銳角，系統會提出警告</div>
                  </div>

                  <div>
                    <FieldLabel>閉合環 (必選)</FieldLabel>
                    <label className="mt-1 flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/5 p-2 text-sm hover:bg-white/10">
                      <div className="text-white/80">閉合環結構</div>
                      <input
                        type="checkbox"
                        checked={woggle.tech_specs.has_closed_ring}
                        onChange={(e) =>
                          touch({
                            ...project,
                            woggle: { ...woggle, tech_specs: { ...woggle.tech_specs, has_closed_ring: e.target.checked } },
                          })
                        }
                      />
                    </label>
                    <div className="mt-1 text-[11px] text-white/45">[Rule 04] 必須閉合環，確保領巾可穿過</div>
                  </div>

                  <div>
                    <FieldLabel>色彩</FieldLabel>
                    <ColorPicker
                      colors={woggle.tech_specs.colors}
                      pantoneCodes={woggle.tech_specs.pantone_codes}
                      limit={colorLimit}
                      onChange={(next) =>
                        touch({
                          ...project,
                          woggle: {
                            ...woggle,
                            tech_specs: { ...woggle.tech_specs, colors: next.colors, pantone_codes: next.pantoneCodes },
                          },
                        })
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <FieldLabel>材質 (3D)</FieldLabel>
                    <Select
                      value={woggle.tech_specs.material_3d}
                      onChange={(e) =>
                        touch({
                          ...project,
                          woggle: {
                            ...woggle,
                            tech_specs: { ...woggle.tech_specs, material_3d: e.target.value as WoggleDesign['tech_specs']['material_3d'] },
                          },
                        })
                      }
                    >
                      <option value="CastMetal">鑄造金屬</option>
                      <option value="3DPrint">3D 打印</option>
                    </Select>
                  </div>

                  <div>
                    <FieldLabel>閉合環 (必選)</FieldLabel>
                    <label className="mt-1 flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/5 p-2 text-sm hover:bg-white/10">
                      <div className="text-white/80">閉合環結構</div>
                      <input
                        type="checkbox"
                        checked={woggle.tech_specs.has_closed_ring}
                        onChange={(e) =>
                          touch({
                            ...project,
                            woggle: { ...woggle, tech_specs: { ...woggle.tech_specs, has_closed_ring: e.target.checked } },
                          })
                        }
                      />
                    </label>
                    <div className="mt-1 text-[11px] text-white/45">[Rule 04] 必須閉合環</div>
                  </div>

                  <div className="sm:col-span-2">
                    <FieldLabel>單一主體造型建模描述 (3D)</FieldLabel>
                    <Textarea
                      rows={6}
                      value={woggle.tech_specs.modeling_notes}
                      onChange={(e) =>
                        touch({
                          ...project,
                          woggle: { ...woggle, tech_specs: { ...woggle.tech_specs, modeling_notes: e.target.value } },
                        })
                      }
                      placeholder="例：百合徽主體，外圈繩結紋理，霧面青銅，邊緣倒角 R1.0..."
                    />
                    <div className="mt-1 text-[11px] text-white/45">3D 模式以可脫模/可打印為前提，避免薄片/倒鉤</div>
                  </div>

                  <div>
                    <FieldLabel>銳角邊緣檢測</FieldLabel>
                    <label className="mt-1 flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/5 p-2 text-sm hover:bg-white/10">
                      <div className="text-white/80">存在銳角/割手風險</div>
                      <input
                        type="checkbox"
                        checked={woggle.tech_specs.has_sharp_edges}
                        onChange={(e) =>
                          touch({
                            ...project,
                            woggle: { ...woggle, tech_specs: { ...woggle.tech_specs, has_sharp_edges: e.target.checked } },
                          })
                        }
                      />
                    </label>
                  </div>

                  <div>
                    <FieldLabel>色彩</FieldLabel>
                    <ColorPicker
                      colors={woggle.tech_specs.colors}
                      pantoneCodes={woggle.tech_specs.pantone_codes}
                      limit={colorLimit}
                      onChange={(next) =>
                        touch({
                          ...project,
                          woggle: {
                            ...woggle,
                            tech_specs: { ...woggle.tech_specs, colors: next.colors, pantone_codes: next.pantoneCodes },
                          },
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </Card>
          </FadeIn>
        )}

        <Card className="p-4">
          <SectionTitle title="✅ 交付物" subtitle="Markdown 規格書、JSON 數據、SVG 草稿、PDF 規格（列印存成 PDF）。" />
          <div className="text-sm text-white/70">
            提示：匯出 PDF 會開啟列印視窗。建議在 Chrome / Edge 選擇「另存為 PDF」，即可一鍵產出工廠規格書。
          </div>
        </Card>
      </div>

        <PreviewPanel project={project} issues={issues} />
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-10">
        <AIGeneratePanel project={project} />
      </div>
    </div>
  )
}
