// src/integrations/metahub/client/products/client.ts
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
import {
  setLastQuery as setProductsLastQuery,
  setSelectedId as setProductSelectedId,
  reset as resetProductsState,
  type ListProductsParams,
} from "@/integrations/metahub/rtk/slices/products/slice";

export type Product = ApiProduct;

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

function coerceIsActive(v: unknown): boolean | 0 | 1 | undefined {
  if (v == null) return undefined;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v ? 1 : 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(s)) return 1;
    if (["0", "false", "no", "off"].includes(s)) return 0;
  }
  return undefined;
}

function toNumberOrUndefined(v: unknown): number | undefined {
  if (v == null) return undefined;
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  return undefined;
}

function toEndpointListParams(p?: ListProductsParams | null): EndpointListParams {
  if (!p) return {};
  return {
    category_id: typeof p.category_id === "string" ? p.category_id : undefined,
    is_active: coerceIsActive(p.is_active),
    q: typeof p.q === "string" ? p.q : undefined,
    limit: toNumberOrUndefined(p.limit),
    offset: toNumberOrUndefined(p.offset),
    sort: p.sort === "price" || p.sort === "rating" || p.sort === "created_at" ? p.sort : undefined,
    order: p.order === "asc" || p.order === "desc" ? p.order : undefined,
    slug: typeof p.slug === "string" ? p.slug : undefined,
  };
}

export const products = {
  async list(params?: ListProductsParams) {
    try {
      store.dispatch(setProductsLastQuery(params ?? null));
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

  async getById(id: string) {
    try {
      store.dispatch(setProductSelectedId(id));
      const data = await store
        .dispatch(productsApi.endpoints.getProductById.initiate(id)) // <-- string
        .unwrap();
      return { data: data as ApiProduct, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as ApiProduct | null, error: { message } };
    }
  },

  async getBySlug(slug: string) {
    try {
      const data = await store
        .dispatch(productsApi.endpoints.getProductBySlug.initiate(slug)) // <-- string
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
          .dispatch(productsApi.endpoints.listProductFaqs.initiate({ product_id, only_active }))
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
          .dispatch(productsApi.endpoints.listProductReviews.initiate({ product_id, only_active }))
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
    store.dispatch(resetProductsState());
  },
};
