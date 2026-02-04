// =============================================================
// FILE: src/integrations/rtk/hooks.ts
// Barrel exports for RTK Query hooks (Xilan)
// =============================================================

// =========================
// Public / Shared endpoints
// =========================

// PUBLIC (src/integrations/rtk/public/*)

export * from './rtk/public/profiles.endpoints';
export * from './rtk/public/user_roles.endpoints';

export * from './rtk/public/health.endpoints';
export * from './rtk/public/auth_public.endpoints';

export * from './rtk/public/contacts_public.endpoints';
export * from './rtk/public/email_templates_public.endpoints';

export * from './rtk/public/cart_items.endpoints';
export * from './rtk/public/blog_posts_public.endpoints';

export * from './rtk/public/categories_public.endpoints';
export * from './rtk/public/coupons_public.endpoints';

export * from './rtk/public/custom_pages_public.endpoints';

export * from './rtk/public/faqs.endpoints';
export * from './rtk/public/footer_sections.endpoints';

export * from './rtk/public/menu_items.endpoints';

export * from './rtk/public/site_settings.endpoints';
export * from './rtk/public/topbar_settings.endpoints';

export * from './rtk/public/reviews.endpoints';
export * from './rtk/public/slider_public.endpoints';

export * from './rtk/public/orders.endpoints';
export * from './rtk/public/newsletter_public.endpoints';

export * from './rtk/public/popups.public.endpoints';

export * from './rtk/public/storage_public.endpoints';

export * from './rtk/public/support_tickets.endpoints';
export * from './rtk/public/ticket_replies.endpoints';

export * from './rtk/public/notifications.endpoints';
export * from './rtk/public/fake_public_notifications.endpoints';

export * from './rtk/public/payment_providers.endpoints';
export * from './rtk/public/payment_sessions.endpoints';
export * from './rtk/public/payment_requests.endpoints';
export * from './rtk/public/payment_methods_public.endpoints';
export * from './rtk/public/payments.notify.endpoints';

export * from './rtk/public/products.endpoints';
export * from './rtk/public/product_faqs.endpoints';
export * from './rtk/public/product_reviews.endpoints';
export * from './rtk/public/product_options.endpoints';
export * from './rtk/public/product_stock.endpoints';

export * from './rtk/public/rpc.endpoints';
export * from './rtk/public/functions.endpoints';

export * from './rtk/public/wallet.public.endpoints';
export * from './rtk/public/seo.endpoints';

// =========================
// Admin endpoints
// =========================

// =============================================================
// FILE: src/integrations/rtk/endpoints/admin/_register.ts
// Xilan Admin RTK Query endpoint registry (single import point)
//  - IMPORTANT: Import this file EXACTLY ONCE in admin bootstrap
// =============================================================

/**
 * Admin tarafındaki RTK Query injectEndpoints importlarını tek yerde toplar.
 * Admin component'leri endpoints/admin/*.ts dosyalarını import etmemeli.
 * Hook exportları için hooks.ts (barrel) kullanılacak.
 */

export * from './rtk/admin/api_providers.endpoints';
export * from './rtk/admin/auth_admin.endpoints';

export * from './rtk/admin/blog_admin.endpoints';
export * from './rtk/admin/carts_admin.endpoints';
export * from './rtk/admin/categories_admin.endpoints';
export * from './rtk/admin/contacts_admin.endpoints';
export * from './rtk/admin/coupons_admin.endpoints';
export * from './rtk/admin/custom_pages_admin.endpoints';

export * from './rtk/admin/dashboard_admin.endpoints';
export * from './rtk/admin/db_admin.endpoints';

export * from './rtk/admin/email_templates_admin.endpoints';
export * from './rtk/admin/faqs_admin.endpoints';
export * from './rtk/admin/footer_sections_admin.endpoints';

export * from './rtk/admin/menu_admin.endpoints';
export * from './rtk/admin/newsletter_admin.endpoints';
export * from './rtk/admin/orders_admin.endpoints';

export * from './rtk/admin/payment_providers_admin.endpoints';
export * from './rtk/admin/payment_requests_admin.endpoints';
export * from './rtk/admin/payment_sessions_admin.endpoints';
export * from './rtk/admin/payments_admin.endpoints';
export * from './rtk/admin/payouts_admin.endpoints';

export * from './rtk/admin/popups_admin.endpoints';

export * from './rtk/admin/products_admin.endpoints';
export * from './rtk/admin/products_admin.faqs.endpoints';
export * from './rtk/admin/products_admin.options.endpoints';
export * from './rtk/admin/products_admin.reviews.endpoints';
export * from './rtk/admin/products_admin.stock.endpoints';

export * from './rtk/admin/reviews_admin.endpoints';
export * from './rtk/admin/roles_admin.endpoints';

export * from './rtk/admin/site_settings_admin.endpoints';
export * from './rtk/admin/sliders_admin.endpoints';

export * from './rtk/admin/storage_admin.endpoints';

export * from './rtk/admin/support_admin.endpoints';
export * from './rtk/admin/ticket_replies_admin.endpoints';

export * from './rtk/admin/topbar_admin.endpoints';

export * from './rtk/admin/telegram_admin.endpoints';

export * from './rtk/admin/telegram_webhook.endpoints';
export * from './rtk/admin/telegram_inbound.endpoints';
export * from './rtk/admin/wallet.admin.endpoints';
export * from './rtk/admin/fake_admin_notifications.endpoints';
