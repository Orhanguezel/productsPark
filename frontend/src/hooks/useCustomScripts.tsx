// =============================================================
// FILE: src/hooks/useCustomScriptsRenderer.tsx
// =============================================================
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import {
  useGetSiteSettingByKeyQuery,
} from "@/integrations/hooks";

import type { JsonLike } from '@/integrations/types';

/* ---------- helpers ---------- */

const toStringOrEmpty = (v: JsonLike | undefined): string => {
  if (v == null) return "";
  if (typeof v === "string") return v;
  return String(v);
};

/* ---------- Hook (iç kullanım), export ETMİYORUZ ---------- */
const useCustomScripts = () => {
  // RTK'dan site_settings okuma
  const {
    data: headerSetting,
    isLoading: headerLoading,
    isError: headerError,
  } = useGetSiteSettingByKeyQuery("custom_header_code");

  const {
    data: footerSetting,
    isLoading: footerLoading,
    isError: footerError,
  } = useGetSiteSettingByKeyQuery("custom_footer_code");

  const customHeaderCode = !headerError
    ? toStringOrEmpty(headerSetting?.value)
    : "";
  const customFooterCode = !footerError
    ? toStringOrEmpty(footerSetting?.value)
    : "";

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
      // attribute'ları kopyala
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
            return (
              <meta key={`m-p-${idx}`} property={property} content={content} />
            );
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
