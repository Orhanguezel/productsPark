// =============================================================
// FILE: src/integrations/rtk/endpoints/_register.ts
// Xilan RTK Query endpoint registry (single import point)
//  - IMPORTANT: Import this file EXACTLY ONCE in app bootstrap
// =============================================================

/**
 * Bu dosya RTK Query injectEndpoints çağrılarını tek yerde toplar.
 * Komponentler endpoints/*.ts dosyalarını import ETMEMELİ.
 * Hook importları için ayrı "hooks" (barrel) dosyası kullanın.
 */

// PUBLIC (src/integrations/rtk/public/*)

import './profiles.endpoints';
import './user_roles.endpoints';

import './health.endpoints';
import './auth_public.endpoints';

import './contacts_public.endpoints';
import './email_templates_public.endpoints';

import './cart_items.endpoints';
import './blog_posts_public.endpoints';

import './categories_public.endpoints';
import './coupons_public.endpoints';

import './custom_pages_public.endpoints';

import './faqs.endpoints';
import './footer_sections.endpoints';

import './menu_items.endpoints';

import './site_settings.endpoints';
import './topbar_settings.endpoints';

import './reviews.endpoints';
import './slider_public.endpoints';

import './orders.endpoints';
import './newsletter_public.endpoints';

import './popups.public.endpoints';

import './storage_public.endpoints';

import './support_tickets.endpoints';
import './ticket_replies.endpoints';

import './notifications.endpoints';
import './fake_public_notifications.endpoints';

import './payment_providers.endpoints';
import './payment_requests.endpoints';
import './payment_sessions.endpoints';
import './payments.notify.endpoints';

import './products.endpoints';
import './product_faqs.endpoints';
import './product_reviews.endpoints';
import './product_options.endpoints';
import './product_stock.endpoints';

import './rpc.endpoints';
import './functions.endpoints';

import './wallet.public.endpoints';
