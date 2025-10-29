// =============================================================
// FILE: src/integrations/metahub/db/normalizers/customPages.ts
// =============================================================
import type { UnknownRow } from "../types";

export function normalizeCustomPageRows(rows: UnknownRow[]): UnknownRow[] {
  const isObj = (x: unknown): x is Record<string, unknown> =>
    typeof x === "object" && x !== null;

  return rows.map((r) => {
    const c: Record<string, unknown> = { ...r };

    const title = typeof c.title === "string" ? c.title : "";
    const slug = typeof c.slug === "string" ? c.slug : "";

    const raw = c.content;
    let html = "";
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw) as unknown;
        html = isObj(parsed) && typeof parsed["html"] === "string" ? (parsed["html"] as string) : raw;
      } catch { html = raw; }
    } else if (isObj(raw) && typeof raw["html"] === "string") {
      html = raw["html"] as string;
    } else if (typeof c["content_html"] === "string") {
      html = c["content_html"] as string;
    }

    const ip = c.is_published;
    const is_published = ip === true || ip === 1 || ip === "1" || ip === "true";

    const metaTitle = typeof c.meta_title === "string" ? c.meta_title : null;
    const metaDesc = typeof c.meta_description === "string" ? c.meta_description : null;

    c.title = title;
    c.slug = slug;
    c.content = html;
    c.is_published = is_published;
    c.meta_title = metaTitle;
    c.meta_description = metaDesc;

    return c as UnknownRow;
  });
}
