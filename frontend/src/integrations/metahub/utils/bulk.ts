
// -------------------------------------------------------------
// FILE: src/integrations/metahub/utils/bulk.ts
// -------------------------------------------------------------
import { notifyError, notifyInfo, notifySuccess } from "@/integrations/metahub/ui/toast/helpers";

export type BulkStats = { total: number; ok: number; fail: number };
export type BulkResult<ID extends string = string, R = unknown> = { id: ID; ok: boolean; data?: R; error?: string };

export async function bulkRun<ID extends string, R>(ids: ID[], worker: (id: ID) => Promise<R>, opts?: { title?: string; success?: string; error?: string; concurrency?: number }) {
  if (ids.length === 0) { notifyInfo("Seçim yok"); return { stats: { total: 0, ok: 0, fail: 0 } as BulkStats, results: [] as BulkResult<ID, R>[] }; }

  const conc = Math.max(1, Math.min(opts?.concurrency ?? 4, 16));
  notifyInfo(`${opts?.title ?? "Toplu işlem"} başladı (${ids.length})`);

  const results: BulkResult<ID, R>[] = [];
  let index = 0; let ok = 0; let fail = 0;

  async function next(): Promise<void> {
    const i = index++; if (i >= ids.length) return;
    const id = ids[i];
    try { const data = await worker(id); results.push({ id, ok: true, data }); ok++; }
    catch (e) { results.push({ id, ok: false, error: e instanceof Error ? e.message : String(e) }); fail++; }
    await next();
  }

  const workers = Array.from({ length: conc }, () => next());
  await Promise.all(workers);

  const stats: BulkStats = { total: ids.length, ok, fail };
  if (fail === 0) notifySuccess(opts?.success ?? "Toplu işlem tamamlandı");
  else notifyError(opts?.error ?? "Bazı kayıtlar işlenemedi", undefined, `${ok}/${ids.length} başarılı`);

  return { stats, results } as const;
}
