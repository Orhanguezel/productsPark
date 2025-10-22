// Yorumları temizle + güvenli split
export function cleanSql(input: string): string {
  // -- satır sonuna kadar ve /* ... */ blok yorumlarını temizle
  return input
    .replace(/--.*?(\r?\n|$)/g, '$1')
    .replace(/\/\*[\s\S]*?\*\//g, '');
}

// ; ile biten cümleleri ayrıştır (stringlerin içinde ; varsa bu basit split bozulabilir
// fakat tipik schema/seed dosyalarında sorun çıkmaz)
export function splitStatements(sql: string): string[] {
  return sql
    .split(/;\s*(?:\r?\n|$)/g)
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => s.endsWith(';') ? s : s + ';');
}

export function logStep(msg: string) {
  const ts = new Date().toISOString().replace('T',' ').replace('Z','');
  console.log(`[${ts}] ${msg}`);
}
