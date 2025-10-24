import { store } from "@/store";
import { normalizeError } from "@/integrations/metahub/core/errors";
import { customPagesApi } from "@/integrations/metahub/rtk/endpoints/custom_pages.endpoints";
import type { CustomPageView } from "@/integrations/metahub/db/types";

/** helpers */
const toBool = (x: unknown): boolean =>
  x === true || x === 1 || x === "1" || x === "true";

const isRecord = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null;

/** RTK tipini UI tipine dönüştürür */
function toView(row: unknown): CustomPageView {
  const r = (row ?? {}) as Record<string, unknown>;

  let html = "";
  if (typeof r["content_html"] === "string") {
    html = r["content_html"] as string;
  } else if (typeof r["content"] === "string") {
    try {
      const parsed = JSON.parse(r["content"] as string) as unknown;
      if (isRecord(parsed) && typeof parsed["html"] === "string") {
        html = parsed["html"] as string;
      } else {
        html = r["content"] as string;
      }
    } catch {
      html = r["content"] as string;
    }
  } else if (isRecord(r["content"]) && typeof (r["content"] as Record<string, unknown>)["html"] === "string") {
    html = (r["content"] as Record<string, unknown>)["html"] as string;
  }

  return {
    id: String(r["id"] ?? ""),
    title: String(r["title"] ?? ""),
    slug: String(r["slug"] ?? ""),
    content: html,
    meta_title: (typeof r["meta_title"] === "string" ? r["meta_title"] : null) as string | null,
    meta_description: (typeof r["meta_description"] === "string" ? r["meta_description"] : null) as string | null,
    is_published: toBool(r["is_published"]),
    created_at: typeof r["created_at"] === "string" ? (r["created_at"] as string) : undefined,
    updated_at: typeof r["updated_at"] === "string" ? (r["updated_at"] as string) : undefined,
  };
}

export const custom_pages = {
  async list(
    params?: Parameters<typeof customPagesApi.endpoints.listCustomPages.initiate>[0],
  ) {
    try {
      const data = await store
        .dispatch(customPagesApi.endpoints.listCustomPages.initiate(params ?? {}))
        .unwrap();

      const items: CustomPageView[] = Array.isArray(data) ? data.map((r) => toView(r)) : [];
      return { data: items, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as CustomPageView[] | null, error: { message } };
    }
  },

  async getBySlug(slug: string, opts?: { locale?: string }) {
    try {
      const data = await store
        .dispatch(customPagesApi.endpoints.getCustomPageBySlug.initiate({ slug, locale: opts?.locale }))
        .unwrap();

      const item: CustomPageView = toView(data);
      return { data: item, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as CustomPageView | null, error: { message } };
    }
  },

  async getById(id: string) {
    try {
      const data = await store
        .dispatch(customPagesApi.endpoints.getCustomPageById.initiate(id))
        .unwrap();

      const item: CustomPageView = toView(data);
      return { data: item, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as CustomPageView | null, error: { message } };
    }
  },
};

// ✔️ Standart: named export var (export const ...) + optional default export
export default custom_pages;
