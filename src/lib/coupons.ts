// Utilidades para CSV de cupones: fetch + parse tolerante
// URL por defecto: Google Sheet público provisto en el enunciado

export const DEFAULT_CSV_URL =
  process.env.CSV_URL ||
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTZ-GFIahnmzB09C1GWCvAs1PaNXmpN2_Ed5taWtseTRlqx0P8-ZKJ28TOsvziFOw/pub?gid=1321470601&single=true&output=csv";

export type CouponRow = {
  code: string;
  type?: string | null;
  level?: "inicial" | "media" | "alta" | string | null;
  week?: string | null;
  stock?: number | null;
  redeemed?: number | null;
  [k: string]: any;
};

export function isoWeekString(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((+d - +yearStart) / 86400000 + 1) / 7);
  const ww = String(weekNo).padStart(2, "0");
  return `${d.getUTCFullYear()}-W${ww}`;
}

// CSV parser minimalista con soporte de comillas
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        cur.push(cell);
        cell = "";
      } else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && next === "\n") i++; // CRLF
        cur.push(cell);
        rows.push(cur);
        cur = [];
        cell = "";
      } else {
        cell += ch;
      }
    }
  }
  if (cell.length > 0 || cur.length > 0) {
    cur.push(cell);
    rows.push(cur);
  }
  return rows.filter((r) => r.length > 0);
}

function indexOfHeader(headers: string[], candidates: string[]) {
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (let i = 0; i < lower.length; i++) {
    for (const c of candidates) {
      if (lower[i].includes(c)) return i;
    }
  }
  return -1;
}

export async function fetchCoupons(): Promise<CouponRow[]> {
  const res = await fetch(DEFAULT_CSV_URL, {
    // Importante: fetch server-side en API route
    next: { revalidate: 60 }, // caché 1 min
  });
  if (!res.ok) throw new Error(`CSV fetch error (${res.status})`);
  const text = await res.text();
  const rows = parseCSV(text);
  if (rows.length < 2) return [];

  const headers = rows[0];
  const codeIdx = indexOfHeader(headers, ["code", "coupon", "cupon", "código", "codigo"]);
  const levelIdx = indexOfHeader(headers, ["level", "nivel", "difficulty"]);
  const weekIdx = indexOfHeader(headers, ["week", "semana"]);
  const typeIdx = indexOfHeader(headers, ["type", "tipo", "reward", "premio"]);
  const stockIdx = indexOfHeader(headers, ["stock", "available", "disponible"]);
  const usedIdx = indexOfHeader(headers, ["usado", "redeemed", "used"]);

  const items: CouponRow[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const code = codeIdx >= 0 ? (row[codeIdx] || "").trim() : "";
    if (!code) continue;
    const level =
      levelIdx >= 0
        ? (row[levelIdx] || "").toLowerCase().trim()
        : null;
    const week = weekIdx >= 0 ? (row[weekIdx] || "").trim() : null;
    const type = typeIdx >= 0 ? (row[typeIdx] || "").trim() : null;
    const stock =
      stockIdx >= 0 ? Number.parseInt((row[stockIdx] || "0").replace(/\D/g, "")) : null;
    const redeemed =
      usedIdx >= 0 ? Number.parseInt((row[usedIdx] || "0").replace(/\D/g, "")) : null;

    items.push({ code, level, week, type, stock, redeemed, raw: row });
  }
  return items;
}

export async function fetchCouponsFor(level: "inicial" | "media" | "alta") {
  const all = await fetchCoupons();
  const currentWeek = isoWeekString(new Date());
  let filtered = all.filter((c) => {
    if (c.level) {
      const lv = (c.level || "").toLowerCase();
      if (!lv.includes(level)) return false;
    }
    // si no hay columna de semana, es válido
    if (!c.week) return true;
    // normalizar semana tipo "2025-W33"
    const w = c.week.toUpperCase().replace(/\s+/g, "");
    return w.includes(currentWeek.toUpperCase());
  });

  if (filtered.length === 0) {
    // Fallback: si no hay semana en CSV, usar por nivel ignorando semana
    filtered = all.filter((c) => {
      if (!c.level) return true; // si no hay nivel, aceptar cualquiera
      return (c.level || "").toLowerCase().includes(level);
    });
  }

  if (filtered.length === 0) return null;

  // Elegir aleatorio
  const pick = filtered[Math.floor(Math.random() * filtered.length)];
  return pick;
}
