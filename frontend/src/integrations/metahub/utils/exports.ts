// -------------------------------------------------------------
// FILE: src/integrations/metahub/utils/exports.ts
// -------------------------------------------------------------
export type CsvOptions = { separator?: string; bom?: boolean };

export function toCSV<T extends Record<string, unknown>>(rows: readonly T[], opts?: CsvOptions): string {
  if (!rows.length) return "";
  const sep = opts?.separator ?? ",";
  const headers = Object.keys(rows[0] as object);
  const esc = (v: unknown) => {
    const s = String(v ?? "");
    if (s.includes('"') || s.includes(sep) || /[\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.join(sep)];
  for (const r of rows) lines.push(headers.map((h) => esc((r as Record<string, unknown>)[h])).join(sep));
  const body = lines.join("\n");
  return (opts?.bom ? "\uFEFF" : "") + body;
}

export function downloadCSV(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

/* ===== SheetJS minimal türleri + type guard ===== */

type SheetJSLike = {
  utils: {
    json_to_sheet: (rows: readonly Record<string, unknown>[]) => unknown;
    book_new: () => unknown;
    book_append_sheet: (wb: unknown, ws: unknown, name: string) => void;
  };
  write: (wb: unknown, opts: { type: "array"; bookType: "xlsx" }) => ArrayBuffer;
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isFn(v: unknown): v is (...args: unknown[]) => unknown {
  return typeof v === "function";
}

function isSheetJSLike(m: unknown): m is SheetJSLike {
  if (!isObject(m)) return false;
  const utils = (m as Record<string, unknown>)["utils"];
  const write = (m as Record<string, unknown>)["write"];
  if (!isObject(utils) || !isFn(write)) return false;

  const jts = (utils as Record<string, unknown>)["json_to_sheet"];
  const bn = (utils as Record<string, unknown>)["book_new"];
  const bas = (utils as Record<string, unknown>)["book_append_sheet"];

  return isFn(jts) && isFn(bn) && isFn(bas);
}

/** SheetJS (xlsx) modülünü browser'da dinamik yükle (any kullanmadan). */
async function importSheetJS(): Promise<SheetJSLike | null> {
  if (typeof window === "undefined") return null; // SSR'da yükleme yok

  // Literal vermiyoruz ki TS modül deklarasyonu arayıp build'i bozmasın.
  const spec: string = "xlsx";
  try {
    const modUnknown: unknown = await import(/* @vite-ignore */ (spec as string));
    const modResolved: unknown = (isObject(modUnknown) && "default" in modUnknown)
      ? (modUnknown as { default: unknown }).default
      : modUnknown;
    if (isSheetJSLike(modResolved)) return modResolved;
  } catch {
    // ESM dağıtımı için fallback
  }

  try {
    const altSpec: string = "xlsx/dist/xlsx.mjs";
    const modUnknown: unknown = await import(/* @vite-ignore */ (altSpec as string));
    const modResolved: unknown = (isObject(modUnknown) && "default" in modUnknown)
      ? (modUnknown as { default: unknown }).default
      : modUnknown;
    if (isSheetJSLike(modResolved)) return modResolved;
  } catch {
    // yoksay
  }

  return null;
}

export async function downloadXLSX<T extends Record<string, unknown>>(filename: string, rows: readonly T[]): Promise<void> {
  // Boşsa direkt CSV
  if (!rows?.length) {
    downloadCSV(filename.replace(/\.xlsx$/i, ".csv"), toCSV(rows ?? [], { bom: true }));
    return;
  }

  const XLSX = await importSheetJS();
  if (!XLSX) {
    // Paket yok veya yüklenemedi → CSV fallback
    downloadCSV(filename.replace(/\.xlsx$/i, ".csv"), toCSV(rows, { bom: true }));
    return;
  }

  try {
    // rows'u json_to_sheet'in beklediği şekle daraltıyoruz
    const plainRows = rows as readonly Record<string, unknown>[];
    const ws = XLSX.utils.json_to_sheet(plainRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    const wbout = XLSX.write(wb, { type: "array", bookType: "xlsx" });

    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  } catch {
    // Her ihtimale karşı yine CSV'ye düş
    downloadCSV(filename.replace(/\.xlsx$/i, ".csv"), toCSV(rows, { bom: true }));
  }
}
