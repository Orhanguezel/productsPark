// Basit bir mustache-benzeri değişken yerleştirme:
// {{ key }} biçimindeki tüm eşleşmeleri params[key] ile değiştirir.
function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// İsteğe bağlı: HTML kaçışına ihtiyaç varsa buraya ekleyebilirsin.
// Şimdilik değerleri olduğu gibi koyuyoruz (template zaten HTML).
function valueToString(v: unknown) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  return String(v);
}

// Template içinden {{var}} anahtarlarını çıkarır.
export function extractVariablesFromText(input: string): string[] {
  const re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  const out = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(input))) out.add(m[1]);
  return Array.from(out);
}

export function renderTextWithParams(input: string, params: Record<string, any>) {
  let output = input;
  for (const [k, v] of Object.entries(params || {})) {
    const re = new RegExp(`\\{\\{\\s*${escapeRegExp(k)}\\s*\\}\\}`, 'g');
    output = output.replace(re, valueToString(v));
  }
  // Tanımsız kalan değişkenleri boşaltmak istiyorsan uncomment:
  // output = output.replace(/\{\{\s*[a-zA-Z0-9_]+\s*\}\}/g, '');
  return output;
}

// Çift-JSON normalize: "\"[\"a\",\"b\"]\"" → ["a","b"]
export function parseVariablesColumn(variables: string | null | undefined): string[] | null {
  if (!variables) return null;
  try {
    const v1 = JSON.parse(variables);
    if (Array.isArray(v1) && v1.every((x) => typeof x === 'string')) return v1;
    if (typeof v1 === 'string') {
      const v2 = JSON.parse(v1);
      if (Array.isArray(v2) && v2.every((x) => typeof x === 'string')) return v2;
    }
  } catch {
    // yut
  }
  return null;
}
