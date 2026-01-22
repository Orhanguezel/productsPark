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

import './api_providers.endpoints';
import './auth_admin.endpoints';

import './blog_admin.endpoints';
import './carts_admin.endpoints';
import './categories_admin.endpoints';
import './contacts_admin.endpoints';
import './coupons_admin.endpoints';
import './custom_pages_admin.endpoints';

import './dashboard_admin.endpoints';
import './db_admin.endpoints';

import './email_templates_admin.endpoints';
import './faqs_admin.endpoints';
import './footer_sections_admin.endpoints';

import './menu_admin.endpoints';
import './newsletter_admin.endpoints';
import './orders_admin.endpoints';

import './payment_providers_admin.endpoints';
import './payment_requests_admin.endpoints';
import './payment_sessions_admin.endpoints';
import './payments_admin.endpoints';
import './payouts_admin.endpoints';

import './popups_admin.endpoints';

import './products_admin.endpoints';
import './products_admin.faqs.endpoints';
import './products_admin.options.endpoints';
import './products_admin.reviews.endpoints';
import './products_admin.stock.endpoints';

import './reviews_admin.endpoints';
import './roles_admin.endpoints';

import './site_settings_admin.endpoints';
import './sliders_admin.endpoints';

import './storage_admin.endpoints';
import './support_admin.endpoints';
import './ticket_replies_admin.endpoints';

import './topbar_admin.endpoints';
