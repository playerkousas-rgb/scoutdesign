# Scout Factory Designer

引導式網頁應用：協助童軍/活動主辦方在不了解工藝細節的情況下，仍能設計出**工廠可生產**的童軍紀念章（Badge）與巾圈（Woggle）。

- 前端：Vite + React + TypeScript + Tailwind CSS
- AI 生圖：支援 **Cloudflare Workers AI (SDXL)** 與 **Leonardo.ai**（透過你自己的 Serverless/Proxy endpoint）
- 匯出：Markdown 規格書、JSON、PDF 規格包、PNG（分享用/量產用 300DPI）

---

## 1. 功能概覽

### 1.1 專業工藝校驗（Hardcoded Rules）
- **[Rule 01]** 刺繡文字高度 `< 4mm` → 黃色警告「文字可能模糊」
- **[Rule 02]** 開啟 Cut-out（鏤空）→ 檢測支撐寬度（刺繡至少 `≥ 3mm`）
- **[Rule 03]** 併合章（Puzzle）→ 自動預留 `0.5mm` 組裝公差
- **[Rule 04]** 巾圈必須閉合環結構
- **巾圈內徑**：鎖定 `30mm`（便於領巾穿過）

### 1.2 即時預覽
- 右側 Real-time Preview：SVG 草稿 + 校驗結果

### 1.3 匯出交付
- `design-spec.md`：工廠規格書（Markdown）
- `design-data.json`：結構化資料（JSON）
- `factory-spec-xxxx.pdf`：規格包（含出血視覺化、平面稿、AI 工藝效果圖、色版、規格摘要）
- `flat-design-xxxx.png`：分享用 PNG（高解析示意）
- `print-ready-xxxx.png`：**量產用 PNG**（以成品尺寸 + 出血 + 300DPI 計算像素輸出）

> 注意：print-ready PNG 的「300DPI」是用**像素尺寸**保證（工廠通常看像素是否足夠）。若要更進階的刀模線/裁切線分層輸出，可在此專案基礎上擴充 die-line SVG。

---

## 2. 快速開始（本機）

```bash
npm install
npm run dev
```

建置：

```bash
npm run build
npm run preview
```

---

## 3. AI 生圖（兩個 Provider 切換）

專案內建 Provider 切換：
- Cloudflare Workers AI (SDXL)
- Leonardo.ai

### 3.1 為什麼需要 Proxy Endpoint？
不建議直接在前端呼叫第三方 AI（會暴露 token / key）。
本專案採用「**你提供一個 Serverless endpoint**」的方式：
- 你可以用 Cloudflare Worker / Vercel Function / 任何後端做代理
- 前端只依固定合約呼叫，部署到 Vercel/GitHub 後也不需要改前端程式

### 3.2 Endpoint 合約（請務必對上）

#### Cloudflare Workers AI（SDXL）
前端會 `POST`：

```json
{
  "prompt": "...",
  "width": 768,
  "height": 768,
  "steps": 25,
  "model": "sdxl"
}
```

你可以回傳：
- `Content-Type: image/png`（直接回傳 PNG bytes）
- 或 `application/json`：

```json
{ "image": "<base64>", "mime": "image/png" }
```

#### Leonardo.ai
前端會 `POST`：

```json
{
  "prompt": "...",
  "width": 768,
  "height": 768,
  "steps": 25,
  "stylePreset": "sticker"
}
```

你可以回傳：
- JSON：`{ "image_base64": "...", "mime": "image/png" }`
- 或 JSON：`{ "image_url": "https://..." }`

---

## 4. 環境變數（Vercel）

在 Vercel Project Settings → Environment Variables 設定：

### 4.1 Cloudflare Workers AI
- `VITE_CF_WORKERS_AI_ENDPOINT`：你的 Worker endpoint
- `VITE_CF_WORKERS_AI_TOKEN`：用於呼叫該 endpoint 的 Bearer token（由你決定如何驗證）

### 4.2 Leonardo
- `VITE_LEONARDO_ENDPOINT`：你的 Leonardo proxy endpoint
- `VITE_LEONARDO_API_KEY`：Leonardo API key（或 proxy 的 token）

### 4.3 使用者自填 API Key（前端）
UI 也提供「使用者自填 endpoint/token」功能（儲存在 LocalStorage）。
若使用者未填，系統會自動使用上述 Vercel env vars。

---

## 5. 量產 PNG（DPI/尺寸）說明

### 5.1 Badge 預設
- 成品尺寸：`10mm`
- 出血：`3mm`
- 目標 DPI：`300`

輸出畫布尺寸（含出血）：
- `(10 + 3*2)mm = 16mm`

像素換算：
- `px = mm / 25.4 * DPI`

> 你可以在資料模型（`src/lib/models.ts`）的 tech specs 修改預設，並擴充 UI 讓使用者可調整。

---

## 6. 專案結構（重點檔案）

- `src/pages/Designer.tsx`：主流程 UI
- `src/lib/rules.ts`：工藝規則（hardcode）
- `src/lib/exporters.ts`：Markdown/JSON/SVG/PROMPT
- `src/lib/aiProviders.ts`：AI Provider 呼叫（Cloudflare / Leonardo）
- `src/lib/pdf.ts`：PDF 規格包輸出
- `src/lib/png.ts`：PNG 匯出（分享用 / 量產 300DPI）

---

## 7. 部署到 Vercel

1. Push 到 GitHub
2. Vercel Import repo
3. 設定 Environment Variables
4. Deploy

---

## 8. 授權與注意事項

- 本專案內建 Pantone-lite 色庫僅供 demo/概念使用；正式商用請使用具授權的色庫資料。
- AI 生圖屬「概念圖」用途，工廠量產以規格/刀模/打樣為準。
