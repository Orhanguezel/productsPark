

// =============================================================
// FILE: src/integrations/metahub/client/catalog-extras/client.ts (reviews + faqs + stock)
// =============================================================
import { store as store_cx } from "@/store";
import { normalizeError as nErr_cx } from "@/integrations/metahub/core/errors";
import { productReviewsApi, type ProductReview } from "@/integrations/metahub/rtk/endpoints/product_reviews.endpoints";
import { productFaqsApi, type ProductFaq } from "@/integrations/metahub/rtk/endpoints/product_faqs.endpoints";
import { productStockApi, type ProductStock } from "@/integrations/metahub/rtk/endpoints/product_stock.endpoints";

export type { ProductReview, ProductFaq, ProductStock };

export const catalogExtras = {
  async reviews(params?: Parameters<typeof productReviewsApi.endpoints.listProductReviews.initiate>[0]) {
    try { const data = await store_cx.dispatch(productReviewsApi.endpoints.listProductReviews.initiate(params ?? {})).unwrap(); return { data: data as ProductReview[], error: null as null }; }
    catch (e) { const { message } = nErr_cx(e); return { data: null as ProductReview[] | null, error: { message } }; }
  },
  async faqs(params?: Parameters<typeof productFaqsApi.endpoints.listProductFaqs.initiate>[0]) {
    try { const data = await store_cx.dispatch(productFaqsApi.endpoints.listProductFaqs.initiate(params ?? {})).unwrap(); return { data: data as ProductFaq[], error: null as null }; }
    catch (e) { const { message } = nErr_cx(e); return { data: null as ProductFaq[] | null, error: { message } }; }
  },
  async stockByProduct(productId: string) {
    try { const data = await store_cx.dispatch(productStockApi.endpoints.getProductStockByProductId.initiate(productId)).unwrap(); return { data: data as ProductStock, error: null as null }; }
    catch (e) { const { message } = nErr_cx(e); return { data: null as ProductStock | null, error: { message } }; }
  },
};
