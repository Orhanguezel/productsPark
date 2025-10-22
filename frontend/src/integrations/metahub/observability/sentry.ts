// -------------------------------------------------------------
// FILE: src/integrations/metahub/observability/sentry.ts (optional)
// -------------------------------------------------------------
export type SentryCfg = { dsn: string; environment?: string; release?: string };

type SentryLike = {
  init: (opts: { dsn: string; environment?: string; release?: string }) => unknown;
  captureException: (
    error: unknown,
    context?: { extra?: Record<string, unknown> }
  ) => unknown;
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isFn(v: unknown): v is (...args: unknown[]) => unknown {
  return typeof v === "function";
}

function isSentryLike(m: unknown): m is SentryLike {
  if (!isObject(m)) return false;
  const init = (m as Record<string, unknown>)["init"];
  const captureException = (m as Record<string, unknown>)["captureException"];
  return isFn(init) && isFn(captureException);
}

async function importSentry(): Promise<SentryLike | null> {
  // Browser-only: SSR'da import etmeyelim
  if (typeof window === "undefined") return null;

  // TS'nin module declaration aramasını tetiklememek için literal yerine değişken kullanıyoruz
  const candidates: string[] = ["@sentry/browser", "@sentry/react", "@sentry/nextjs"];

  for (const spec of candidates) {
    try {
      const modUnknown: unknown = await import(/* @vite-ignore */ (spec as string));
      // Hem named export hem default export olasılığı
      const resolved: unknown =
        isObject(modUnknown) && "default" in modUnknown
          ? (modUnknown as { default: unknown }).default
          : modUnknown;

      if (isSentryLike(resolved)) return resolved;
      if (isSentryLike(modUnknown)) return modUnknown as SentryLike;
    } catch {
      // diğer adaya geç
    }
  }
  return null;
}

export async function initSentry(cfg: SentryCfg): Promise<boolean> {
  const Sentry = await importSentry();
  if (!Sentry) return false;
  try {
    Sentry.init({ dsn: cfg.dsn, environment: cfg.environment, release: cfg.release });
    return true;
  } catch {
    return false;
  }
}

export async function captureException(
  error: unknown,
  context?: Record<string, unknown>
): Promise<void> {
  const Sentry = await importSentry();
  if (!Sentry) return;
  try {
    Sentry.captureException(error, { extra: context });
  } catch {
    /* noop */
  }
}
