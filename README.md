# Scout Factory Designer

引導式網頁應用：協助童軍/活動主辦方在不了解工藝細節的情況下，仍能設計出**工廠可生產**的童軍紀念章（Badge）與巾圈（Woggle）。

- 前端：Vite + React + TypeScript + Tailwind CSS
- AI 生圖：
  - **直接連接 API Key (無須後端)**：支援 **OpenAI DALL·E 3**、**Together AI (FLUX.1)**、**Google Gemini Imagen 3**、**Cloudflare Workers AI 直連**、**Leonardo.ai 直連**
  - **Serverless Proxy 代理**：支援自建 Cloudflare Worker / Vercel Function Endpoint
- 匯出：PROMPT (平面)、PROMPT (工藝)、Markdown 規格書、JSON、PDF 規格包、PNG（分享用 / 量產用 300DPI）

---

## 1. 功能概覽

### 1.1 專業工藝校驗（Hardcoded Rules）
- **[Rule 01]** 刺繡文字高度 `< 4mm` → 黃色警告「文字可能模糊」
- **[Rule 02]** 開啟 Cut-out（鏤空）→ 檢測支撐寬度（刺繡至少 `≥ 3mm`）
- **[Rule 03]** 併合章（Puzzle）→ 自動預留 `0.5mm` 組裝公差
- **[Rule 04]** 巾圈必須閉合環結構
- **巾圈內徑**：鎖定 `30mm`（便於領巾穿過）

### 1.2 雙模式 PROMPT 生成（平面 vs 工藝）
- **PROMPT (平面 / Flat 2D Graphic)**：專門產生平視向量風、純淨無陰影背景的 2D 圖案設計提示詞，適合用於向量描邊與刀模參考。
- **PROMPT (工藝 / Craft 3D Production)**：專門產生模擬真實工藝（刺繡線路與密度、織嘜細膩紋理、PVC 軟膠立體層次、古銅鑄造壓紋）的物理打樣效果圖提示詞。
- 支援一鍵複製 PROMPT 或下載 `ai-prompt-flat.txt` 與 `ai-prompt-craft.txt`。
- 匯出的 Markdown 規格書也會完整記錄兩種 PROMPT 供工廠與設計團隊參考。

### 1.3 即時預覽
- 右側 Real-time Preview：SVG 草稿 + 校驗結果 + PROMPT (平面 / 工藝) 一鍵複製

### 1.4 匯出交付
- `design-spec.md`：工廠規格書（Markdown，含 PROMPT 平面/工藝提示詞）
- `design-data.json`：結構化資料（JSON）
- `ai-prompt-flat.txt` / `ai-prompt-craft.txt`：AI 提示詞純文字檔
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

## 3. AI 生圖（直接連接 API Key / 代理模式）

專案內建 Provider 自由切換與設定：
1. **OpenAI DALL·E 3 (直接連接 API Key)** ⭐ 推薦：輸入 `sk-...` API Key 即可一鍵調用 DALL-E 3，支援自訂 Base URL 供中轉/官方 API 使用。
2. **Together AI / FLUX.1-schnell (直接連接 API Key)** ⚡ 極速：輸入 Together API Key 即可呼叫當前最強大的開放模型 FLUX.1。
3. **Google Gemini Imagen 3 (直接連接 API Key)**：輸入 Google AI Studio 申請的 API Key 直接生成。
4. **Cloudflare Workers AI (SDXL / FLUX)**：可直接輸入 Cloudflare Account ID + Token 呼叫官方 API，或填入自建 Proxy Endpoint。
5. **Leonardo.ai**：可輸入 Leonardo Direct API Key 呼叫官方 API，或填入代理 Endpoint。

所有使用者填寫的 API Key 僅儲存於當前瀏覽器的 `localStorage`，不經過任何第三方伺服器。

---

## 4. 環境變數（Vercel 預設部署可選）

在 Vercel Project Settings → Environment Variables 設定（可選，提供未設定用戶預設值）：
- `VITE_OPENAI_API_KEY`：OpenAI API Key
- `VITE_TOGETHER_API_KEY`：Together AI API Key
- `VITE_GEMINI_API_KEY`：Google Gemini API Key
- `VITE_CF_WORKERS_AI_ENDPOINT` / `VITE_CF_WORKERS_AI_TOKEN`：Cloudflare Worker 代理或 Token
- `VITE_LEONARDO_ENDPOINT` / `VITE_LEONARDO_API_KEY`：Leonardo API 參數

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
- `src/lib/exporters.ts`：Markdown/JSON/SVG/PROMPT (平面 2D / 工藝 3D)
- `src/lib/aiProviders.ts`：AI Provider 呼叫（OpenAI / Together AI / Gemini / Cloudflare / Leonardo）
- `src/lib/userSecrets.ts`：瀏覽器本地 API Key 安全儲存管理
- `src/lib/pdf.ts`：PDF 規格包輸出
- `src/lib/png.ts`：PNG 匯出（分享用 / 量產 300DPI）

---

## 7. 部署到 Vercel

1. Push 到 GitHub
2. Vercel Import repo
3. 設定 Environment Variables（可選）
4. Deploy

---

## 8. 授權與注意事項

- 本專案內建 Pantone-lite 色庫僅供 demo/概念使用；正式商用請使用具授權的色庫資料。
- AI 生圖屬「概念圖」用途，工廠量產以規格/刀模/打樣為準。

