
// -------------------------------------------------------------
// FILE: src/integrations/metahub/observability/logtail.ts (optional HTTP fallback)
// -------------------------------------------------------------
export type LogtailCfg = { endpoint: string; token?: string };

export async function logError(message: string, fields?: Record<string, unknown>, cfg?: LogtailCfg) {
  try {
    await fetch(cfg?.endpoint ?? "/logs", { method: "POST", headers: { "content-type": "application/json", ...(cfg?.token ? { authorization: `Bearer ${cfg.token}` } : {}) }, body: JSON.stringify({ level: "error", message, fields, ts: new Date().toISOString() }) });
  } catch { /* ignore */ }
}
