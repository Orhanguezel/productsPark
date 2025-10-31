// =============================================================
// FILE: src/integrations/metahub/db/types/index.ts
// =============================================================

export type { UnknownRow } from "./common";

// Domain exports (public API uyumu için aynı isimlerle dışa açıyoruz)
export type { ApiProviderRow } from "./apiProviders";
export type { CategoryRow } from "./categories";
export type { SettingValue,SiteSettingRow,TopbarSettingRow,EmailTemplateRow,ValueType } from "./site";
export type {
  ProductRow,
  ProductView,
  ProductStockRow,
  ProductReviewRow,
  ProductFaqRow,
} from "./products";
export type { MenuItemRow } from "./menu";
export type {
  BlogPostRow,
  FooterLink,
  FooterSectionRow,
  FooterSectionView,
  CustomPageRow,
  CustomPageView,
  PopupRow,
} from "./content";
export type {
  CouponRow,
  CartItemRow,
  OrderRow,
  OrderItemRow,
  OrderView,
  OrderItemView,
} from "./orders";

export type { ProfileRow, UserRoleRow, AdminUserRaw, AdminUserView, UserRoleName } from "./users";

export type { WalletTransactionRow, WalletDepositRequestRow } from "./wallet";
export type { SupportTicketView, TicketReplyView } from "./support";

export type {
  ApiPaymentRow, PaymentRow,
  ApiPaymentRequestRow, PaymentRequestRow,
  ApiPaymentSessionRow, PaymentSessionRow,
  PaymentProviderRow,
} from "./payments";

/* ===========================
 * Known Tables & TableRow map
 * =========================== */

/** Bu projede bildiğimiz tüm tablo adları */
export type KnownTables =
  | "products"
  | "categories"
  | "orders"
  | "order_items"
  | "cart_items"
  | "coupons"
  | "blog_posts"
  | "product_stock"
  | "product_reviews"
  | "product_faqs"
  | "profiles"
  | "wallet_transactions"
  | "wallet_deposit_requests"
  | "payment_providers"
  | "payment_sessions"
  | "payments"
  | "payment_requests"
  | "product_variants"
  | "product_options"
  | "product_option_values"
  | "site_settings"
  | "topbar_settings"
  | "popups"
  | "email_templates"
  | "menu_items"
  | "footer_sections"
  | "custom_pages"

  | "uploads"
  | "notifications"
  | "activity_logs"
  | "audit_events"
  | "telemetry_events"
  | "user_roles"
  | "support_tickets"
  | "ticket_replies"
  | "api_providers";

/** TableRow eşlemesi (inline import types ile — local isim gerektirmez) */
export type TableRow<TName extends string> =
  TName extends "categories" ? import("./categories").CategoryRow :
  TName extends "products" ? import("./products").ProductRow :
  TName extends "product_reviews" ? import("./products").ProductReviewRow :
  TName extends "product_faqs" ? import("./products").ProductFaqRow :
  TName extends "site_settings" ? import("./site").SiteSettingRow :
  TName extends "menu_items" ? import("./menu").MenuItemRow :
  TName extends "footer_sections" ? import("./content").FooterSectionRow :
  TName extends "popups" ? import("./content").PopupRow :
  TName extends "user_roles" ? import("./users").UserRoleRow :
  TName extends "topbar_settings" ? import("./site").TopbarSettingRow :
  TName extends "coupons" ? import("./orders").CouponRow :
  TName extends "cart_items" ? import("./orders").CartItemRow :
  TName extends "blog_posts" ? import("./content").BlogPostRow :
  TName extends "custom_pages" ? import("./content").CustomPageView :
  TName extends "support_tickets" ? import("./support").SupportTicketView :
  TName extends "ticket_replies" ? import("./support").TicketReplyView :
  TName extends "wallet_transactions" ? import("./wallet").WalletTransactionRow :
  TName extends "wallet_deposit_requests" ? import("./wallet").WalletDepositRequestRow :
  TName extends "profiles" ? import("./users").ProfileRow :
  TName extends "product_stock" ? import("./products").ProductStockRow :
  TName extends "payments" ? import("./payments").PaymentRow :                 // NEW
  TName extends "payment_requests" ? import("./payments").PaymentRequestRow :  // NEW
  TName extends "payment_sessions" ? import("./payments").PaymentSessionRow :  // NEW
  TName extends "payment_providers" ? import("./payments").PaymentProviderRow :
  TName extends "orders" ? import("./orders").OrderView :
  TName extends "order_items" ? import("./orders").OrderItemView :
  TName extends "api_providers" ? import("./apiProviders").ApiProviderRow :
  // Diğer (şimdilik tiplenmemiş) tablolar
  import("./common").UnknownRow;
