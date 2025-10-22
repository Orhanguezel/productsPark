

// -------------------------------------------------------------
// FILE: src/integrations/metahub/seo/meta.ts
// -------------------------------------------------------------
export type MetaInput = {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  locale?: string; // e.g., "tr_TR"
  siteName?: string;
  noindex?: boolean;
};

export function buildMeta(meta: MetaInput): Record<string, string> {
  const out: Record<string, string> = {};
  if (meta.title) out["og:title"] = meta.title;
  if (meta.description) out["description"] = meta.description, out["og:description"] = meta.description;
  if (meta.url) out["og:url"] = meta.url, out["canonical"] = meta.url;
  if (meta.image) out["og:image"] = meta.image;
  out["og:type"] = "website";
  if (meta.siteName) out["og:site_name"] = meta.siteName;
  if (meta.locale) out["og:locale"] = meta.locale;
  if (meta.noindex) out["robots"] = "noindex, nofollow";
  return out;
}

export function applyMeta(meta: MetaInput): void {
  const map = buildMeta(meta);
  const head = document.head;
  Object.entries(map).forEach(([k, v]) => {
    if (k === "canonical") {
      let link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!link) { link = document.createElement("link"); link.rel = "canonical"; head.appendChild(link); }
      link.href = v;
    } else if (k === "description" || k === "robots") {
      let tag = head.querySelector<HTMLMetaElement>(`meta[name="${k}"]`);
      if (!tag) { tag = document.createElement("meta"); tag.name = k; head.appendChild(tag); }
      tag.content = v;
    } else {
      let tag = head.querySelector<HTMLMetaElement>(`meta[property="${k}"]`);
      if (!tag) { tag = document.createElement("meta"); tag.setAttribute("property", k); head.appendChild(tag); }
      tag.setAttribute("content", v);
    }
  });
}
