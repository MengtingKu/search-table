export interface SheetData {
  messages: Record<string, Record<string, string>>;
  languages: string[];
}

/** Google Sheet gviz API 的欄位資訊 */
interface GoogleSheetColumn {
  id: string;
  label: string;
  type: string;
}

/** Google Sheet gviz API 的每一個 cell */
interface GoogleSheetCell {
  v?: string | number | null;
  f?: string; // formatted value（可忽略）
}

/** Google Sheet gviz API 的每一列 */
interface GoogleSheetRow {
  c: GoogleSheetCell[];
}

/** Google Sheet gviz API table 結構 */
interface GoogleSheetTable {
  cols: GoogleSheetColumn[];
  rows: GoogleSheetRow[];
  parsedNumHeaders?: number;
}

/** Google Sheet gviz API 回傳的完整物件 */
interface GoogleSheetResponse {
  version: string;
  reqId: string;
  status: string;
  sig?: string;
  table: GoogleSheetTable;
}

/** 快取結構 */
interface I18nCache {
  timestamp: number;
  data: SheetData;
}

const SHEET_ID = '11XADbaf_thn8DRmZeRDZp2LFQVm_j81FyQ3D2KRjOT8';
const BASE_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq`;
const CACHE_KEY = `i18n-cache-${SHEET_ID}`;
const CACHE_EXPIRE_HOURS = 24;

function buildUrl(headers = 1, gid?: string): string {
  let url = `${BASE_URL}?tqx=out:json&headers=${headers}`;
  if (gid) url += `&gid=${gid}`;
  return url;
}

function isCacheValid(raw: I18nCache | null): raw is I18nCache {
  if (!raw) return false;
  const hoursPassed = (Date.now() - raw.timestamp) / (1000 * 60 * 60);
  return hoursPassed < CACHE_EXPIRE_HOURS;
}

export async function loadSheetData(): Promise<SheetData> {
  // === 1️⃣ 嘗試使用快取 ===
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed: I18nCache = JSON.parse(cached);
      if (isCacheValid(parsed)) {
        console.log('[i18n] 使用快取資料');
        return parsed.data;
      } else {
        localStorage.removeItem(CACHE_KEY);
      }
    }
  } catch (e) {
    console.warn('[i18n] 讀取快取失敗，將重新抓取', e);
  }

  // === 2️⃣ 抓取 Google Sheet ===
  const url = buildUrl(1);
  let text = '';
  try {
    const res = await fetch(url);
    text = await res.text();
  } catch (err) {
    console.error('[i18n] fetch Google Sheet 失敗', err);
    throw new Error('無法抓取 Google Sheet（網路錯誤）');
  }

  // === 3️⃣ 解析 JSONP ===
  let raw: GoogleSheetResponse;
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('回傳格式非預期');
    const jsonText = text.substring(start, end + 1);
    raw = JSON.parse(jsonText) as GoogleSheetResponse;
  } catch (err) {
    console.error('[i18n] 解析 Google Sheet 回傳 JSON 失敗', err);
    throw new Error('解析 Google Sheet JSON 失敗');
  }

  const table = raw.table;
  let cols = table.cols;
  let rows = table.rows;

  // === 4️⃣ 若 cols.label 全為空，使用備援：第一列當 header ===
  const labels = cols.map(c => c.label?.trim() ?? '');
  const hasAnyLabel = labels.some(l => l !== '');

  if (!hasAnyLabel) {
    console.warn('[i18n] 偵測到空表頭，將第一列當 header');
    if (rows.length === 0) throw new Error('Google Sheet 無資料可讀');
    const headerRow = rows[0]?.c;
    if (!headerRow) {
      throw new Error('無法取得第一列作為表頭');
    }
    const derivedHeaders = headerRow.map(cell =>
      (cell.v ?? '').toString().trim()
    );
    if (!derivedHeaders.some(h => h !== '')) {
      throw new Error('無法從第一列推斷表頭');
    }

    cols = derivedHeaders.map((h, i) => ({
      id: String.fromCharCode(65 + i),
      label: h,
      type: 'string',
    }));
    rows = rows.slice(1);
  }

  const headers: string[] = cols.map(c => c.label.trim());
  if (!headers.includes('key')) {
    console.error('[i18n] 目前解析到的 headers:', headers);
    throw new Error(`Google Sheet 必須有 'key' 欄位作為識別`);
  }

  // === 5️⃣ rows 轉換成 key-value ===
  const intermediate: Record<string, Record<string, string>> = {};
  for (const row of rows) {
    const cells = row.c ?? [];
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      const cellValue = cells[i]?.v;
      obj[h] = cellValue != null ? String(cellValue) : '';
    });
    const theKey = obj['key'];
    if (theKey) intermediate[theKey] = obj;
  }

  // === 6️⃣ 組成 messages ===
  const languages = headers.filter(h => h !== 'key');
  const messages: Record<string, Record<string, string>> = {};
  for (const lang of languages) {
    messages[lang] = {};
    for (const key in intermediate) {
      messages[lang][key] = intermediate[key]?.[lang] ?? '';
    }
  }

  const data: SheetData = { messages, languages };

  // === 7️⃣ 寫入快取 ===
  try {
    const cacheData: I18nCache = { timestamp: Date.now(), data };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    console.log('[i18n] 已快取 i18n 資料', { languages });
  } catch (e) {
    console.warn('[i18n] 寫入快取失敗', e);
  }

  return data;
}
