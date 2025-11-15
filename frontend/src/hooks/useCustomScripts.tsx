// =============================================================
// FILE: src/hooks/useCustomScriptsRenderer.tsx
// =============================================================
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { metahub } from "@/integrations/metahub/client";
import type { SiteSettingRow } from "@/integrations/metahub/db/types/site";
import type { SubscriptionResult } from "@/integrations/metahub/realtime/channel";
import {
  useGetSiteSettingByKeyQuery,
} from "@/integrations/metahub/rtk/endpoints/site_settings.endpoints";

/* ---------- Realtime şekli: mevcut Channel API'ine yapısal uyum ---------- */
type ChannelStatus = "SUBSCRIBED" | "TIMED_OUT" | "CLOSED" | "CHANNEL_ERROR";
type Handler = (payload: unknown) => void;

interface ChannelLike {
  on(event: string, cb: Handler): ChannelLike;
  on(event: string, filter: Record<string, unknown>, cb: Handler): ChannelLike;
  subscribe(
    cb?: (s: ChannelStatus) => void
  ): Promise<SubscriptionResult> | SubscriptionResult | unknown;
}

interface RealtimeClientLike {
  channel: (name: string) => ChannelLike;
  removeChannel: (ch: SubscriptionResult | Promise<SubscriptionResult>) => void;
}

const isRealtimeClientLike = (x: unknown): x is RealtimeClientLike => {
  const o = x as Record<string, unknown>;
  return (
    !!o &&
    typeof (o as { channel?: unknown }).channel === "function" &&
    typeof (o as { removeChannel?: unknown }).removeChannel === "function"
  );
};

/* ---------- Tip korumaları ---------- */
type RowChange<T> = { old: T | null; new: T | null };

const isSiteSettingRow = (x: unknown): x is SiteSettingRow =>
  typeof x === "object" && x !== null && "key" in (x as Record<string, unknown>);

const asRowChange = <T,>(payload: unknown): RowChange<T> | null => {
  if (typeof payload !== "object" || payload === null) return null;
  const r = payload as { old?: unknown; new?: unknown };
  const oldV = "old" in r ? (r.old as unknown) : undefined;
  const newV = "new" in r ? (r.new as unknown) : undefined;
  const oldTyped = isSiteSettingRow(oldV) ? (oldV as T) : null;
  const newTyped = isSiteSettingRow(newV) ? (newV as T) : null;
  if (oldTyped === null && newTyped === null) return null;
  return { old: oldTyped, new: newTyped };
};

const isPromise = <T,>(x: unknown): x is Promise<T> =>
  !!x && typeof (x as { then?: unknown }).then === "function";

const isSubscriptionResult = (x: unknown): x is SubscriptionResult => {
  if (typeof x !== "object" || x === null) return false;
  const any = x as { data?: unknown; error?: unknown };
  const sub = (any.data as { subscription?: { unsubscribe?: unknown } } | undefined)
    ?.subscription;
  return typeof any.error === "object" && !!sub && typeof sub.unsubscribe === "function";
};

/* ---------- Hook (iç kullanım), export ETMİYORUZ ---------- */
const useCustomScripts = () => {
  const [customHeaderCode, setCustomHeaderCode] = useState<string>("");
  const [customFooterCode, setCustomFooterCode] = useState<string>("");

  // RTK'dan site_settings okuma
  const {
    data: headerSetting,
    isLoading: headerLoading,
    refetch: refetchHeader,
  } = useGetSiteSettingByKeyQuery("custom_header_code");

  const {
    data: footerSetting,
    isLoading: footerLoading,
    refetch: refetchFooter,
  } = useGetSiteSettingByKeyQuery("custom_footer_code");

  // RTK verisini local string state’e çevir
  useEffect(() => {
    const val = headerSetting?.value;
    setCustomHeaderCode(
      typeof val === "string" ? val : val == null ? "" : String(val)
    );
  }, [headerSetting]);

  useEffect(() => {
    const val = footerSetting?.value;
    setCustomFooterCode(
      typeof val === "string" ? val : val == null ? "" : String(val)
    );
  }, [footerSetting]);

  // Realtime: değişiklikte RTK refetch
  useEffect(() => {
    if (!isRealtimeClientLike(metahub)) return;

    let subscription: SubscriptionResult | Promise<SubscriptionResult> | null = null;

    const ch = metahub
      .channel("custom-scripts-changes")
      .on<RowChange<SiteSettingRow>>(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "site_settings",
          // key filtresi (PostgREST syntax)
          filter: "key=in.(custom_header_code,custom_footer_code)",
        },
        (payload: unknown) => {
          const change = asRowChange<SiteSettingRow>(payload);
          const key = change?.new?.key ?? change?.old?.key ?? null;
          if (!key) return;

          if (key === "custom_header_code") {
            void refetchHeader();
          } else if (key === "custom_footer_code") {
            void refetchFooter();
          }
        }
      );

    const ret = ch.subscribe();
    if (isPromise<SubscriptionResult>(ret)) {
      subscription = ret;
    } else if (isSubscriptionResult(ret)) {
      subscription = ret;
    }

    return () => {
      if (subscription && isRealtimeClientLike(metahub)) {
        try {
          metahub.removeChannel(subscription);
        } catch (e) {
          console.warn("removeChannel failed:", e);
        }
      }
    };
  }, [refetchHeader, refetchFooter]);

  return {
    customHeaderCode,
    customFooterCode,
    loading: headerLoading || footerLoading,
  };
};

/* ---------- Component (TEK export) ---------- */
export const CustomScriptsRenderer = () => {
  const { customHeaderCode, customFooterCode } = useCustomScripts();

  // Footer’daki script’leri body’ye enjekte et
  useEffect(() => {
    if (!customFooterCode) return;

    const tmp = document.createElement("div");
    tmp.innerHTML = customFooterCode;

    const appended: HTMLScriptElement[] = [];
    for (const script of Array.from(tmp.getElementsByTagName("script"))) {
      const s = document.createElement("script");
      for (const attr of Array.from(script.attributes)) {
        s.setAttribute(attr.name, attr.value);
      }
      if (script.src) s.src = script.src;
      else s.textContent = script.textContent ?? "";
      document.body.appendChild(s);
      appended.push(s);
    }

    return () => {
      for (const s of appended) {
        try {
          s.remove();
        } catch {
          /* no-op */
        }
      }
    };
  }, [customFooterCode]);

  if (!customHeaderCode) return null;

  // Header tarafı için meta / link / script (src) parse
  return (
    <Helmet>
      <meta charSet="utf-8" />
      {customHeaderCode.split("\n").map((line, idx) => {
        const t = line.trim();
        if (!t) return null;

        if (t.startsWith("<meta")) {
          const name = t.match(/name="([^"]+)"/)?.[1];
          const content = t.match(/content="([^"]+)"/)?.[1];
          const property = t.match(/property="([^"]+)"/)?.[1];
          if (name && content) {
            return <meta key={`m-n-${idx}`} name={name} content={content} />;
          }
          if (property && content) {
            return <meta key={`m-p-${idx}`} property={property} content={content} />;
          }
        }

        if (t.startsWith("<script")) {
          const src = t.match(/src="([^"]+)"/)?.[1];
          if (src) return <script key={`s-${idx}`} src={src} />;
        }

        if (t.startsWith("<link")) {
          const href = t.match(/href="([^"]+)"/)?.[1];
          const rel = t.match(/rel="([^"]+)"/)?.[1];
          if (href && rel) {
            return <link key={`l-${idx}`} rel={rel} href={href} />;
          }
        }

        return null;
      })}
    </Helmet>
  );
};
