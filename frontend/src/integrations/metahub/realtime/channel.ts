// src/integrations/metahub/realtime/channel.ts

const BASE_URL = (import.meta.env.VITE_API_URL as string) ?? "/api";
const POLL_MS = Number(import.meta.env.VITE_METAHUB_REALTIME_POLL_MS ?? 0); // 0 => kapalı

export type ChannelStatus = "SUBSCRIBED" | "TIMED_OUT" | "CLOSED" | "CHANNEL_ERROR";
type Handler = (payload: unknown) => void;

type Listener = {
  event: string;
  filter?: Record<string, unknown>;
  cb: Handler;
};

export type SubscriptionResult = {
  data: { subscription: { unsubscribe: () => Promise<void> } };
  error: null;
};

class Channel {
  private name: string;
  private listeners: Listener[] = [];
  private timer: number | null = null;

  constructor(name: string) {
    this.name = name;
  }

  // Overload'lar: Supabase stili 2 veya 3 argüman
  on(event: string, cb: Handler): this;
  on(event: string, filter: Record<string, unknown>, cb: Handler): this;
  on(event: string, a: Handler | Record<string, unknown>, b?: Handler): this {
    const hasFilter = typeof a === "object" && a !== null;
    const cb: Handler = hasFilter ? (b as Handler) : (a as Handler);
    const filter = hasFilter ? (a as Record<string, unknown>) : undefined;

    if (!this.listeners.some(l => l.event === event && l.cb === cb && shallowEqual(l.filter, filter))) {
      this.listeners.push({ event, filter, cb });
    }
    return this;
  }

  off(event: string, cb: Handler): this {
    this.listeners = this.listeners.filter(l => !(l.event === event && l.cb === cb));
    return this;
  }

  private emit(event: string, payload: unknown) {
    for (const l of this.listeners) {
      if (l.event !== event) continue;
      // (İstersen filter match ekleyebilirsin)
      l.cb(payload);
    }
  }

  async subscribe(cb?: (s: ChannelStatus) => void): Promise<SubscriptionResult> {
    cb?.("SUBSCRIBED");

    // Polling fallback (opsiyonel)
    if (POLL_MS > 0) {
      let since = Date.now();
      this.timer = window.setInterval(async () => {
        try {
          const res = await fetch(
            `${BASE_URL}/realtime/${encodeURIComponent(this.name)}?since=${since}`,
            { method: "GET", credentials: "include" }
          );
          if (res.ok) {
            const items = (await res.json()) as Array<{ event: string; payload: unknown; ts?: number }>;
            items.forEach((it) => this.emit(it.event, it.payload));
            since = Date.now();
          }
        } catch {
          // sessiz geç
        }
      }, Math.max(POLL_MS, 1000));
    }

    return {
      data: { subscription: { unsubscribe: () => this.unsubscribe() } },
      error: null,
    };
  }

  async unsubscribe() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.listeners = [];
  }
}

function shallowEqual(a?: Record<string, unknown>, b?: Record<string, unknown>): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  for (const k of ak) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}

const active = new Map<string, Channel>();

export function channel(name: string) {
  if (!active.has(name)) active.set(name, new Channel(name));
  return active.get(name)!;
}

/**
 * Eski kullanım biçimleriyle uyumluluk:
 * - Channel instance
 * - subscribe() sonucu
 * - Promise<subscribe() sonucu>
 */
export function removeChannel(
  ch: Channel | SubscriptionResult | Promise<SubscriptionResult>
) {
  // Channel ise direkt kapat + registry’den kaldır
  if (ch instanceof Channel) {
    ch.unsubscribe();
    for (const [k, v] of active) if (v === ch) active.delete(k);
    return;
  }

  // Promise ise resolve edip unsubscribe çağır
  if (typeof (ch as Promise<SubscriptionResult>)?.then === "function") {
    (ch as Promise<SubscriptionResult>)
      .then((res) => {
        res?.data?.subscription?.unsubscribe?.();
      })
      .catch(() => {});
    return;
  }

  // Doğrudan subscription objesi ise
  try {
    (ch as SubscriptionResult)?.data?.subscription?.unsubscribe?.();
  } catch {
    /* ignore */
  }
}

export function removeAllChannels() {
  for (const ch of active.values()) ch.unsubscribe();
  active.clear();
}
