// -------------------------------------------------------------
// FILE: src/integrations/metahub/observability/telemetry.ts
// -------------------------------------------------------------
import { store } from "@/store";
import {
  telemetryApi,
  type TelemetryEvent,
} from "@/integrations/metahub/rtk/endpoints/telemetry.endpoints";

const BUF_MAX = 32;
const FLUSH_MS = 5000;

const buffer: TelemetryEvent[] = [];
let timer: number | null = null;
let sessionId: string | null = null;
let globalCtx: Record<string, unknown> = {};

const isBrowser =
  typeof window !== "undefined" && typeof document !== "undefined";

export type TelemetryConfig = {
  enabled?: boolean;
  session?: string; // if omitted, auto-generated
  globalCtx?: Record<string, unknown>; // merged into events.ctx
  flushIntervalMs?: number; // default 5s
  beacons?: boolean; // use navigator.sendBeacon on unload
};

export function initTelemetry(cfg?: TelemetryConfig) {
  if (!isBrowser) return;

  sessionId = cfg?.session ?? sessionId ?? genSessionId();
  globalCtx = {
    ...(cfg?.globalCtx ?? {}),
    ua:
      typeof navigator !== "undefined" && "userAgent" in navigator
        ? navigator.userAgent
        : "",
  };

  const intervalMs = cfg?.flushIntervalMs ?? FLUSH_MS;
  if (timer) window.clearInterval(timer);
  timer = window.setInterval(flush, intervalMs);

  if (cfg?.beacons !== false) {
    window.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onVisibility);
    window.addEventListener("beforeunload", onVisibility);
  }
}

export function setGlobalCtx(patch: Record<string, unknown>) {
  globalCtx = { ...globalCtx, ...patch };
}

export function track(ev: TelemetryEvent) {
  const merged: TelemetryEvent = {
    ...ev,
    session_id: ev.session_id ?? sessionId,
    ctx: { ...(globalCtx ?? {}), ...(ev.ctx ?? {}) },
  } as TelemetryEvent;
  buffer.push(merged);
  if (buffer.length >= BUF_MAX) void flush();
}

export async function flush() {
  if (!buffer.length) return;
  const batch = buffer.splice(0, buffer.length);
  try {
    await store
      .dispatch(
        telemetryApi.endpoints.sendTelemetry.initiate({ events: batch })
      )
      .unwrap();
  } catch {
    try {
      beacon(batch);
    } catch {
      /* ignore */
    }
  }
}

function onVisibility() {
  if (!isBrowser) return;
  if (document.visibilityState === "hidden") {
    const batch = buffer.splice(0, buffer.length);
    if (batch.length)
      try {
        beacon(batch);
      } catch {
        /* noop */
      }
  }
}

function beacon(events: TelemetryEvent[]) {
  if (!isBrowser) return;
  const url = new URL("/telemetry/ingest", window.location.origin);
  const blob = new Blob([JSON.stringify({ events })], {
    type: "application/json",
  });
  if ("sendBeacon" in navigator) {
    (navigator as Navigator & {
      sendBeacon: (u: string | URL, d?: BodyInit) => boolean;
    }).sendBeacon(url.toString(), blob);
  }
}

function genSessionId() {
  return `s_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
}

// NOTE: default paramlarda window/document kullanmıyoruz (SSR güvenliği için)
export function trackPage(
  path?: string,
  title?: string,
  ref?: string | null,
  user_id?: string | null
) {
  const resolvedPath =
    path ?? (isBrowser ? window.location.pathname : "/");
  const resolvedTitle = title ?? (isBrowser ? document.title : "");

  // ❗ TS5076 fix: ?? ve || birlikte kullanılıyorsa parantez şart
  const resolvedRef =
    (ref ?? (isBrowser ? document.referrer : "")) || null;

  track({
    type: "pageview",
    path: resolvedPath,
    title: resolvedTitle,
    ref: resolvedRef,
    ts: Date.now(),
    user_id,
  });
}

export function trackAction(
  name: string,
  props?: Record<string, unknown> | null,
  user_id?: string | null
) {
  track({ type: "action", name, props: props ?? null, ts: Date.now(), user_id });
}

export function trackPerf(
  name: string,
  dur_ms: number,
  ok: boolean,
  meta?: Record<string, unknown> | null,
  user_id?: string | null
) {
  track({
    type: "perf",
    name,
    dur_ms,
    ok,
    meta: meta ?? null,
    ts: Date.now(),
    user_id,
  });
}
