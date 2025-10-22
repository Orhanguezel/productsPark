
// -------------------------------------------------------------
// FILE: src/integrations/metahub/seo/jsonld.ts
// -------------------------------------------------------------
export type Thing = Record<string, unknown>;

export function org(input: { name: string; url: string; logo?: string; sameAs?: string[] }): Thing {
  return { "@context": "https://schema.org", "@type": "Organization", name: input.name, url: input.url, logo: input.logo, sameAs: input.sameAs };
}

export function website(input: { name: string; url: string; searchUrlTemplate?: string }): Thing {
  const base: Thing = { "@context": "https://schema.org", "@type": "WebSite", name: input.name, url: input.url };
  if (input.searchUrlTemplate) (base as any).potentialAction = { "@type": "SearchAction", target: input.searchUrlTemplate, "query-input": "required name=q" };
  return base;
}

export function product(input: { name: string; description?: string; image?: string | string[]; sku?: string; brand?: string; offers?: { price: number; priceCurrency: string; availability?: string; url?: string } }): Thing {
  return { "@context": "https://schema.org", "@type": "Product", ...input };
}

export function article(input: { headline: string; image?: string | string[]; datePublished?: string; dateModified?: string; author?: { name: string } }): Thing {
  return { "@context": "https://schema.org", "@type": "Article", ...input };
}

export function breadcrumb(items: Array<{ name: string; item: string }>): Thing {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: it.item })) };
}

export function injectJsonLd(obj: Thing): void {
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.text = JSON.stringify(obj);
  document.head.appendChild(script);
}
