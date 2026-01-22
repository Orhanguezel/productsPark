// =============================================================
// FILE: src/components/admin/products/form/sections/DemoSection.tsx
// =============================================================
"use client";

import React, { useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import type { ProductAdmin } from "@/integrations/types";

type Props = {
  formData: Partial<ProductAdmin>;
  setField: <K extends keyof ProductAdmin>(key: K, val: ProductAdmin[K] | any) => void;
};

const ensureHttps = (url: string) => {
  const s = (url || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
};

function toEmbedUrl(raw: string): { src: string; provider: string; trusted: boolean } {
  const url = ensureHttps(raw);
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");

    // YouTube
    if (host === "youtube.com" || host === "youtu.be" || host === "m.youtube.com") {
      let id = "";
      if (host === "youtu.be") {
        id = u.pathname.split("/").filter(Boolean)[0] || "";
      } else if (u.pathname.startsWith("/shorts/")) {
        id = u.pathname.split("/").filter(Boolean)[1] || "";
      } else {
        id = u.searchParams.get("v") || "";
      }
      if (id) return { src: `https://www.youtube.com/embed/${id}`, provider: "YouTube", trusted: true };
      return { src: url, provider: "YouTube", trusted: true };
    }

    // Vimeo
    if (host === "vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean)[0] || "";
      if (id && /^\d+$/.test(id)) {
        return { src: `https://player.vimeo.com/video/${id}`, provider: "Vimeo", trusted: true };
      }
      return { src: url, provider: "Vimeo", trusted: true };
    }

    // CodeSandbox
    if (host === "codesandbox.io") {
      // /s/abc → embed/abc
      const parts = u.pathname.split("/").filter(Boolean);
      const idx = parts.indexOf("s");
      const id = idx >= 0 ? parts[idx + 1] : parts[0];
      if (id) return { src: `https://codesandbox.io/embed/${id}?view=preview&hidenavigation=1`, provider: "CodeSandbox", trusted: true };
      return { src: url, provider: "CodeSandbox", trusted: true };
    }

    // CodePen
    if (host === "codepen.io") {
      // /user/pen/ID → /user/embed/ID?default-tab=result
      const parts = u.pathname.split("/").filter(Boolean);
      const penIdx = parts.indexOf("pen");
      if (penIdx > 0 && parts[penIdx + 1]) {
        const user = parts[0];
        const id = parts[penIdx + 1];
        return { src: `https://codepen.io/${user}/embed/${id}?default-tab=result`, provider: "CodePen", trusted: true };
      }
      return { src: url, provider: "CodePen", trusted: true };
    }

    // JSFiddle
    if (host === "jsfiddle.net") {
      // /abc/ → /abc/embedded/result/
      const id = u.pathname.split("/").filter(Boolean)[0] || "";
      if (id) return { src: `https://jsfiddle.net/${id}/embedded/result/`, provider: "JSFiddle", trusted: true };
      return { src: url, provider: "JSFiddle", trusted: true };
    }

    // Bilinmeyen/özel host → direkt deneriz (birçok site X-Frame-Options ile engeller)
    return { src: url, provider: host, trusted: false };
  } catch {
    return { src: url, provider: "custom", trusted: false };
  }
}

export default function DemoSection({ formData, setField }: Props) {
  const active =
    (!!formData.demo_url && String(formData.demo_url).trim() !== "") || !!formData.demo_embed_enabled;

  const embed = useMemo(() => {
    const url = String(formData.demo_url ?? "").trim();
    if (!url) return null;
    return toEmbedUrl(url);
  }, [formData.demo_url]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Demo & Önizleme Ayarları</h3>
          <p className="text-sm text-muted-foreground">Ürününüz için canlı demo gösterimini yapılandırın.</p>
        </div>

        {/* Ana toggle: açarken embed'i default 1 yap (ilk seferde görünür olsun) */}
        <Switch
          id="demo_active"
          checked={active}
          onCheckedChange={(checked) => {
            if (checked) {
              const nextUrl = String(formData.demo_url ?? "").trim();
              setField("demo_url", nextUrl); // dokunma, kullanıcı yazacaksa yazsın
              setField("demo_embed_enabled", (formData.demo_embed_enabled ? 1 : 1) as any);
              setField("demo_button_text", (formData.demo_button_text as string) || "Demoyu İncele");
            } else {
              setField("demo_url", "");
              setField("demo_embed_enabled", 0);
              setField("demo_button_text", "Demoyu İncele");
            }
          }}
        />
      </div>

      {active ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="demo_url">Demo URL</Label>
            <Input
              id="demo_url"
              type="url"
              placeholder="https://www.youtube.com/watch?v=xxxx  |  https://vimeo.com/123456789  |  https://codesandbox.io/s/xxxx"
              value={(formData.demo_url as string) ?? ""}
              onChange={(e) => setField("demo_url", e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="demo_embed_enabled"
              checked={!!formData.demo_embed_enabled}
              onCheckedChange={(v) => setField("demo_embed_enabled", v ? 1 : 0)}
            />
            <Label htmlFor="demo_embed_enabled">Sayfada iframe ile göster</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="demo_button_text">Demo Buton Metni</Label>
            <Input
              id="demo_button_text"
              placeholder="Demoyu İncele"
              value={(formData.demo_button_text as string) ?? ""}
              onChange={(e) => setField("demo_button_text", e.target.value)}
            />
          </div>

          {!!formData.demo_embed_enabled && embed?.src ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Demo Önizleme {embed.provider ? `(${embed.provider})` : ""}</Label>
                <a
                  href={ensureHttps(String(formData.demo_url ?? ""))}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm underline text-primary"
                >
                  Yeni sekmede aç
                </a>
              </div>

              {!embed.trusted && (
                <p className="text-xs text-amber-600">
                  Not: Bazı siteler iframe gömülmesini engeller (<code>frame-ancestors</code> / <code>X-Frame-Options</code>).
                  Önizleme boş gözükürse yukarıdaki linkten yeni sekmede açabilirsiniz.
                </p>
              )}

              <div className="border rounded-lg overflow-hidden bg-muted">
                <iframe
                  src={embed.src}
                  className="w-full h-[420px]"
                  loading="lazy"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Demo Önizleme"
                />
              </div>
              <p className="text-xs text-muted-foreground">Müşterilerin ürün detay sayfasında göreceği demo görünümü</p>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
