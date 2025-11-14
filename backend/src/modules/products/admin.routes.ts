// =============================================================
// FILE: src/modules/products/admin.routes.ts
// =============================================================
import type { FastifyInstance } from "fastify";
import { requireAuth } from "@/common/middleware/auth";

import {
  adminListProducts,
  adminGetProduct,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminBulkSetActive,
  adminReorderProducts,
  adminToggleActive,
  adminToggleHomepage,
  adminSetProductStock,
  adminListUsedStock,
  adminListCategories,
} from "./admin.controller";

import {
  adminListProductFaqs,
  adminCreateProductFaq,
  adminUpdateProductFaq,
  adminToggleFaqActive,
  adminDeleteProductFaq,
  adminReplaceFaqs,
} from "./admin.faqs.controller";

import {
  adminListProductReviews,
  adminCreateProductReview,
  adminUpdateProductReview,
  adminToggleReviewActive,
  adminDeleteProductReview,
  adminReplaceReviews,
} from "./admin.reviews.controller";

import {
  adminListProductOptions,
  adminCreateProductOption,
  adminUpdateProductOption,
  adminDeleteProductOption,
} from "./admin.options.controller";

const BASE = "/admin/products";

export async function registerProductsAdmin(app: FastifyInstance) {
  // Products (core)
  app.get(`${BASE}`, { preHandler: [requireAuth] }, adminListProducts);
  app.get(`${BASE}/:id`, { preHandler: [requireAuth] }, adminGetProduct);
  app.post(`${BASE}`, { preHandler: [requireAuth] }, adminCreateProduct);
  app.patch(`${BASE}/:id`, { preHandler: [requireAuth] }, adminUpdateProduct);
  app.delete(`${BASE}/:id`, { preHandler: [requireAuth] }, adminDeleteProduct);

  // Bulk ops
  app.post(
    `${BASE}/bulk/active`,
    { preHandler: [requireAuth] },
    adminBulkSetActive
  );
  app.post(
    `${BASE}/bulk/reorder`,
    { preHandler: [requireAuth] },
    adminReorderProducts
  );

  // Toggles
  app.patch(
    `${BASE}/:id/active`,
    { preHandler: [requireAuth] },
    adminToggleActive
  );
  app.patch(
    `${BASE}/:id/homepage`,
    { preHandler: [requireAuth] },
    adminToggleHomepage
  );

  // FAQs
  app.get(
    `${BASE}/:id/faqs`,
    { preHandler: [requireAuth] },
    adminListProductFaqs
  );
  app.post(
    `${BASE}/:id/faqs`,
    { preHandler: [requireAuth] },
    adminCreateProductFaq
  );
  app.patch(
    `${BASE}/:id/faqs/:faqId`,
    { preHandler: [requireAuth] },
    adminUpdateProductFaq
  );
  app.patch(
    `${BASE}/:id/faqs/:faqId/active`,
    { preHandler: [requireAuth] },
    adminToggleFaqActive
  );
  app.delete(
    `${BASE}/:id/faqs/:faqId`,
    { preHandler: [requireAuth] },
    adminDeleteProductFaq
  );
  app.put(
    `${BASE}/:id/faqs`,
    { preHandler: [requireAuth] },
    adminReplaceFaqs
  ); // mevcut FE için backward-compatible

  // Reviews
  app.get(
    `${BASE}/:id/reviews`,
    { preHandler: [requireAuth] },
    adminListProductReviews
  );
  app.post(
    `${BASE}/:id/reviews`,
    { preHandler: [requireAuth] },
    adminCreateProductReview
  );
  app.patch(
    `${BASE}/:id/reviews/:reviewId`,
    { preHandler: [requireAuth] },
    adminUpdateProductReview
  );
  app.patch(
    `${BASE}/:id/reviews/:reviewId/active`,
    { preHandler: [requireAuth] },
    adminToggleReviewActive
  );
  app.delete(
    `${BASE}/:id/reviews/:reviewId`,
    { preHandler: [requireAuth] },
    adminDeleteProductReview
  );
  app.put(
    `${BASE}/:id/reviews`,
    { preHandler: [requireAuth] },
    adminReplaceReviews
  ); // mevcut FE için backward-compatible

  // Options
  app.get(
    `${BASE}/:id/options`,
    { preHandler: [requireAuth] },
    adminListProductOptions
  );
  app.post(
    `${BASE}/:id/options`,
    { preHandler: [requireAuth] },
    adminCreateProductOption
  );
  app.patch(
    `${BASE}/:id/options/:optionId`,
    { preHandler: [requireAuth] },
    adminUpdateProductOption
  );
  app.delete(
    `${BASE}/:id/options/:optionId`,
    { preHandler: [requireAuth] },
    adminDeleteProductOption
  );

  // Stock
  app.put(
    `${BASE}/:id/stock`,
    { preHandler: [requireAuth] },
    adminSetProductStock
  );
  app.get(
    `${BASE}/:id/stock/used`,
    { preHandler: [requireAuth] },
    adminListUsedStock
  );

  // Lists used by FE (filters)
  app.get(
    "/admin/categories",
    { preHandler: [requireAuth] },
    adminListCategories
  );
}
