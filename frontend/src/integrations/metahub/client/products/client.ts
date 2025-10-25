import { store } from "@/store";
import { normalizeError } from "@/integrations/metahub/core/errors";
import {
  productsApi,
  type Product as ApiProduct,
  type Faq,
  type Review,
  type ProductOption,
  type Stock,
} from "@/integrations/metahub/rtk/endpoints/products.endpoints";

// ✅ lokal param tipi (UI'de ihtiyaç varsa buradan re-export edebilirsin)
export type ListProductsParams = {
  category_id?: string;
  is_active?: boolean | 0 | 1;
  q?: string;
  limit?: number;
  offset?: number;
  sort?: "price" | "rating" | "created_at";
  order?: "asc" | "desc";
  slug?: string;
};

/* ---------------- helpers ---------------- */
type EndpointListParams = {
  category_id?: string;
  is_active?: boolean | 0 | 1;
  q?: string;
  limit?: number;
  offset?: number;
  sort?: "price" | "rating" | "created_at";
  order?: "asc" | "desc";
  slug?: string;
};

const coerceSort = (
  sort?: EndpointListParams["sort"]
): "price" | "created_at" | undefined => {
  if (sort === "price") return "price";
  if (sort === "created_at") return "created_at";
  // backend rating desteklemiyorsa created_at'e düş
  if (sort === "rating") return "created_at";
  return undefined;
};

const coerceIsActive = (v: unknown): boolean | 0 | 1 | undefined => {
  if (v == null) return undefined;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v ? 1 : 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(s)) return 1;
    if (["0", "false", "no", "off"].includes(s)) return 0;
  }
  return undefined;
};

const toNumberOrUndefined = (v: unknown): number | undefined => {
  if (v == null) return undefined;
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
    return Number(v);
  }
  return undefined;
};

const toEndpointListParams = (p?: ListProductsParams | null): EndpointListParams =>
  !p
    ? {}
    : {
        category_id: typeof p.category_id === "string" ? p.category_id : undefined,
        is_active: coerceIsActive(p.is_active),
        q: typeof p.q === "string" ? p.q : undefined,
        limit: toNumberOrUndefined(p.limit),
        offset: toNumberOrUndefined(p.offset),
        sort: coerceSort(p.sort as EndpointListParams["sort"]),
        order: p.order === "asc" || p.order === "desc" ? p.order : undefined,
        slug: typeof p.slug === "string" ? p.slug : undefined,
      };

/* ---------------- client ---------------- */
export const products = {
  async list(params?: ListProductsParams) {
    try {
      const safe = toEndpointListParams(params ?? null);
      const data = await store
        .dispatch(productsApi.endpoints.listProducts.initiate(safe))
        .unwrap();
      return { data: data as ApiProduct[], error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as ApiProduct[] | null, error: { message } };
    }
  },

  // ✅ birleşik detay (id veya slug)
  async get(idOrSlug: string) {
    try {
      const data = await store
        .dispatch(productsApi.endpoints.getProduct.initiate(idOrSlug))
        .unwrap();
      return { data: data as ApiProduct, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as ApiProduct | null, error: { message } };
    }
  },

  // (geri uyum) — içerde birleşik rotayı kullanmak istersen bunu da aynı şekilde yönlendirebilirsin
  async getById(id: string) {
    try {
      const data = await store
        .dispatch(productsApi.endpoints.getProduct.initiate(id))
        .unwrap();
      return { data: data as ApiProduct, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as ApiProduct | null, error: { message } };
    }
  },

  // (geri uyum)
  async getBySlug(slug: string) {
    try {
      // Unified rota ile de çalışır:
      const data = await store
        .dispatch(productsApi.endpoints.getProduct.initiate(slug))
        .unwrap();
      return { data: data as ApiProduct, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as ApiProduct | null, error: { message } };
    }
  },

  faqs: {
    async list(product_id: string, only_active = true) {
      try {
        const data = await store
          .dispatch(
            productsApi.endpoints.listProductFaqs.initiate({ product_id, only_active })
          )
          .unwrap();
        return { data: data as Faq[], error: null as null };
      } catch (e) {
        const { message } = normalizeError(e);
        return { data: null as Faq[] | null, error: { message } };
      }
    },
  },

  reviews: {
    async list(product_id: string, only_active = true) {
      try {
        const data = await store
          .dispatch(
            productsApi.endpoints.listProductReviews.initiate({ product_id, only_active })
          )
          .unwrap();
        return { data: data as Review[], error: null as null };
      } catch (e) {
        const { message } = normalizeError(e);
        return { data: null as Review[] | null, error: { message } };
      }
    },
  },

  options: {
    async list(product_id: string) {
      try {
        const data = await store
          .dispatch(productsApi.endpoints.listProductOptions.initiate({ product_id }))
          .unwrap();
        return { data: data as ProductOption[], error: null as null };
      } catch (e) {
        const { message } = normalizeError(e);
        return { data: null as ProductOption[] | null, error: { message } };
      }
    },
  },

  stock: {
    async list(product_id: string, is_used?: boolean) {
      try {
        const data = await store
          .dispatch(productsApi.endpoints.listProductStock.initiate({ product_id, is_used }))
          .unwrap();
        return { data: data as Stock[], error: null as null };
      } catch (e) {
        const { message } = normalizeError(e);
        return { data: null as Stock[] | null, error: { message } };
      }
    },
  },

  reset() {
    store.dispatch(productsApi.util.resetApiState());
  },
};
