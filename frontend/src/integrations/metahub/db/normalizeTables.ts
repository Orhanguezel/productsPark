// =============================================================
// FILE: src/integrations/metahub/db/normalizeTables.ts
// =============================================================
import type { UnknownRow, ProductRow } from "./types";

// Toplu normalizer importları
import {
  normalizeBlogRows,
  normalizeCategoryRows,
  normalizeMenuItemRows,
  normalizePopupRows,
  normalizeProductRows,
  normalizeProductReviewRows,
  normalizeProductFaqRows,
  normalizeFooterSectionRows,
  normalizeCartItemRows,
  normalizeOrderRows,
  normalizeOrderItemRows,
  normalizeCouponRows,
  normalizeTopbarRows,
  normalizeCustomPageRows,
  normalizeSupportTicketRows,
  normalizeTicketReplyRows,
  normalizeWalletTransactionRows,
  normalizeWalletDepositRequestRows,
  normalizeProfileRows,
  normalizeProductStockRows,
  normalizeApiProviderRows,
  isProductsPath,
  normalizeSiteSettingRows,
} from "./normalizers";

/**
 * Farklı tablolar için gelen ham satırları normalize eder.
 * Not: Bu fonksiyon sadece SELECT akışında çağrılır.
 */
export function normalizeTableRows(path: string, rows: UnknownRow[]): UnknownRow[] {
  // Products tüm varyant path'leri
  if (isProductsPath(path)) {
    return normalizeProductRows(rows as (ProductRow | UnknownRow)[]);
  }

  switch (path.split("?")[0]) {
    case "/categories":
      return normalizeCategoryRows(rows);

    case "/menu_items":
      return normalizeMenuItemRows(rows);

    case "/popups":
      return normalizePopupRows(rows);

    case "/product_reviews":
      return normalizeProductReviewRows(rows);

    case "/product_faqs":
      return normalizeProductFaqRows(rows);

    case "/footer_sections":
      return normalizeFooterSectionRows(rows);

    case "/cart_items":
      return normalizeCartItemRows(rows);

    case "/orders":
      return normalizeOrderRows(rows);

    case "/order_items":
      return normalizeOrderItemRows(rows);

    case "/coupons":
      return normalizeCouponRows(rows);

    case "/topbar_settings":
      return normalizeTopbarRows(rows);

    case "/blog_posts":
      return normalizeBlogRows(rows);

    case "/custom_pages":
      return normalizeCustomPageRows(rows);

    case "/support_tickets":
      return normalizeSupportTicketRows(rows);

    case "/ticket_replies":
      return normalizeTicketReplyRows(rows);

    case "/wallet_transactions":
      return normalizeWalletTransactionRows(rows);

    case "/wallet_deposit_requests":
      return normalizeWalletDepositRequestRows(rows);

    case "/profiles":
      return normalizeProfileRows(rows);

    case "/product_stock":
      return normalizeProductStockRows(rows);

    case "/api_providers":
      return normalizeApiProviderRows(rows);

    case "/site_settings":
      // Site settings için özel bir normalizer yok
      return normalizeSiteSettingRows(rows);

    default:
      return rows;
  }
}
