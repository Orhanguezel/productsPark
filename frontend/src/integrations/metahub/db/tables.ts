// src/integrations/metahub/db/tables.ts

import type { KnownTables } from "./types";


/** Tabloların yol map'i (hepsi aynı BASE_URL’e gider) */
export const TABLES: Record<KnownTables, string> = {
  // products & relatives
  products: "/products",
  product_stock: "/product_stock",
  product_reviews: "/product_reviews",
  product_faqs: "/product_faqs",
  product_variants: "/product_variants",
  product_options: "/product_options",
  product_option_values: "/product_option_values",

  // content
  categories: "/categories",
  blog_posts: "/blog_posts",
  custom_pages: "/custom_pages",

  // commerce
  orders: "/orders",
  order_items: "/order_items",
  cart_items: "/cart_items",
  coupons: "/coupons",
  wallet_deposit_requests: "/wallet_deposit_requests",
  payment_requests: "/payment_requests",
  payment_providers: "/payment_providers",
  payment_sessions: "/payment_sessions",
  wallet_transactions: "/wallet_transactions",

  // site config
  site_settings: "/site_settings",
  topbar_settings: "/topbar_settings",
  popups: "/popups",
  email_templates: "/email_templates",
  menu_items: "/menu_items",
  footer_sections: "/footer_sections",
  uploads: "/storage/uploads",

  // user & ops
  profiles: "/profiles",
  notifications: "/notifications",
  activity_logs: "/activity_logs",
  audit_events: "/audit_events",
  telemetry_events: "/telemetry/events",
  user_roles: "/user_roles",
  support_tickets: "/support_tickets",
  ticket_replies: "/ticket_replies",
  api_providers: "/api_providers",
};