// =============================================================
// FILE: src/app.ts
// FINAL — Single /api mount + /api/admin prefix for all admin modules
// - No duplicate route registration
// - Storage/static config remains as-is
// =============================================================

import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';

import fs from 'node:fs';
import path from 'node:path';

import authPlugin from './plugins/authPlugin';
import mysqlPlugin from '@/plugins/mysql';

import type { FastifyInstance } from 'fastify';
import { env } from '@/core/env';
import { registerErrorHandlers } from '@/core/error';

// -------------------- Public modules --------------------
import { registerAuth } from '@/modules/auth/router';
import { registerProfiles } from '@/modules/profiles/router';
import { registerRest } from '@/modules/rest/router';
import { registerStorage } from '@/modules/storage/router';
import { registerFunctions } from '@/modules/functions/router';
import { registerRpc } from '@/modules/rpc/router';
import { registerCategories } from '@/modules/categories/router';
import { registerProducts } from '@/modules/products/router';
import { registerCartItems } from '@/modules/cart/router';
import { registerCoupons } from '@/modules/coupons/router';
import { registerOrders } from '@/modules/orders/router';
import { registerCustomPages } from '@/modules/customPages/router';
import { registerBlog } from '@/modules/blog/router';
import { registerMenuItems } from '@/modules/menuItems/router';
import { registerSiteSettings } from '@/modules/siteSettings/router';
import { registerPopups } from '@/modules/popups/router';
import { registerUserRoles } from '@/modules/userRoles/router';
import { registerTopbar } from '@/modules/topbarSettings/router';
import { registerFooterSections } from '@/modules/footerSections/router';
import { registerSupport } from '@/modules/support/router';
import { registerWallet } from '@/modules/wallet/router';
import { registerPayments } from '@/modules/payments/router';
import { registerFaqs } from '@/modules/faqs/router';
import { registerNotifications } from '@/modules/notifications/router';
import { registerMail } from '@/modules/mail/router';
import { registerContacts } from '@/modules/contact/router';
import { registerApiProviders } from '@/modules/api_providers/router';
import { registerSeoRoutes } from '@/modules/seo/router';
import { registerNewsletter } from '@/modules/newsletter/router';

// -------------------- Admin modules --------------------
import { registerProductsAdmin } from '@/modules/products/admin.routes';
import { registerBlogAdmin } from '@/modules/blog/admin.routes';
import { registerMenuItemsAdmin } from '@/modules/menuItems/admin.routes';
import { registerCustomPagesAdmin } from '@/modules/customPages/admin.routes';
import { registerSiteSettingsAdmin } from '@/modules/siteSettings/admin.routes';
import { registerAdminOrders } from '@/modules/orders/admin.routes';
import { registerPaymentsAdmin } from '@/modules/payments/admin.routes';
import { registerUserAdmin } from '@/modules/auth/admin.routes';
import { registerEmailTemplatesAdmin } from '@/modules/email-templates/admin.routes';
import { registerPopupsAdmin } from '@/modules/popups/admin.routes';
import { registerCouponsAdmin } from '@/modules/coupons/admin.routes';
import { registerSupportAdmin } from '@/modules/support/admin.routes';
import { registerFooterSectionsAdmin } from '@/modules/footerSections/admin.routes';
import { registerTopbarAdmin } from '@/modules/topbarSettings/admin.routes';
import { registerFaqsAdmin } from '@/modules/faqs/admin.routes';
import { registerStorageAdmin } from '@/modules/storage/admin.routes';
import { registerDbAdmin } from '@/modules/db_admin/admin.routes';
import { registerContactsAdmin } from '@/modules/contact/admin.routes';
import { registerFakeOrderNotificationsAdmin } from '@/modules/fakeOrderNotifications/admin.routes';
import { registerTelegramWebhook } from '@/modules/webhook/router';
import { registerTelegramAdmin } from '@/modules/telegram/router';
import { registerTelegramAdminRoutes } from '@/modules/telegram/admin.routes';
import { registerNewsletterAdmin } from '@/modules/newsletter/admin.routes';
import { registerWalletAdmin } from '@/modules/wallet/admin.routes';






// -------------------- Fake notification modules (public) --------------------
import { registerFakeNotificationConfig } from './modules/siteSettings/fakeNotificationConfig.router';
import { registerFakeOrderNotifications } from './modules/fakeOrderNotifications/router';

// Storage config (site_settings + env) — localBaseUrl için kullanacağız
import { getStorageSettings } from '@/modules/siteSettings/service';

/* -------------------- helpers -------------------- */

function parseCorsOrigins(v?: string | string[]): boolean | string[] {
  if (!v) return true;
  if (Array.isArray(v)) return v;

  const s = String(v).trim();
  if (!s) return true;

  const arr = s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

  return arr.length ? arr : true;
}

/** uploads root seçimi: env → site_settings → cwd/uploads, ama path yoksa veya izin yoksa cwd/uploads'a düş */
function pickUploadsRoot(rawFromSettings?: string | null): string {
  const fallback = path.join(process.cwd(), 'uploads');

  const envRoot = env.LOCAL_STORAGE_ROOT && String(env.LOCAL_STORAGE_ROOT).trim();
  const candidate = envRoot || (rawFromSettings || '').trim() || fallback;

  const ensureDir = (p: string): string => {
    try {
      if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
      return p;
    } catch {
      if (!fs.existsSync(fallback)) fs.mkdirSync(fallback, { recursive: true });
      return fallback;
    }
  };

  return ensureDir(candidate);
}

/** uploads prefix seçimi: env → site_settings → "/uploads"  (başında / , sonunda tek / ) */
function pickUploadsPrefix(rawFromSettings?: string | null): string {
  const envBase = env.LOCAL_STORAGE_BASE_URL && String(env.LOCAL_STORAGE_BASE_URL).trim();
  let p = envBase || (rawFromSettings || '').trim() || '/uploads';

  if (!p.startsWith('/')) p = `/${p}`;
  p = p.replace(/\/+$/, ''); // sondaki slash'ları temizle
  return `${p}/`; // fastify-static prefix (örn: "/uploads/")
}

/* -------------------- app factory -------------------- */

export async function createApp() {
  const { default: buildFastify } = (await import('fastify')) as unknown as {
    // fastify default export
    default: (opts?: { logger?: boolean }) => FastifyInstance;
  };

  const app = buildFastify({
    logger: env.NODE_ENV !== 'production',
  }) as FastifyInstance;

  // --- CORS ---
  await app.register(cors, {
    origin: parseCorsOrigins(env.CORS_ORIGIN as unknown as string | string[] | undefined),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Prefer',
      'Accept',
      'Accept-Language',
      'x-skip-auth',
      'Range',
      'x-locale',
      'x-requested-with',
    ],
    exposedHeaders: ['x-total-count', 'content-range', 'range'],
  });

  // --- Cookie ---
  const cookieSecret =
    (globalThis as unknown as { Bun?: { env?: Record<string, string | undefined> } }).Bun?.env
      ?.COOKIE_SECRET ??
    process.env.COOKIE_SECRET ??
    'cookie-secret';

  await app.register(cookie, {
    secret: cookieSecret,
    hook: 'onRequest',
    parseOptions: {
      httpOnly: true,
      path: '/',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: env.NODE_ENV === 'production',
    },
  });

  // --- JWT ---
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    cookie: { cookieName: 'access_token', signed: false },
  });

  // 🔒 Guard & 🗄️ MySQL
  await app.register(authPlugin);
  await app.register(mysqlPlugin);

  // === 📁 UPLOADS STATIC SERVE ===
  // DB hazır (mysqlPlugin register edildi). DB yoksa/boşsa fallback çalışır.
  let storageSettings: Awaited<ReturnType<typeof getStorageSettings>> | null = null;
  try {
    storageSettings = await getStorageSettings();
  } catch {
    storageSettings = null;
  }

  const uploadsRoot = pickUploadsRoot(storageSettings?.localRoot);
  const uploadsPrefix = pickUploadsPrefix(storageSettings?.localBaseUrl);

  await app.register(fastifyStatic, {
    root: uploadsRoot,
    prefix: uploadsPrefix,
    decorateReply: false,
  });

  // Health (kök + /api)
  app.get('/health', async () => ({ ok: true }));
  app.get('/api/health', async () => ({ ok: true }));

  // Multipart
  await app.register(multipart, {
    throwFileSizeLimit: true,
    limits: { fileSize: 20 * 1024 * 1024 },
  });

  // =========================================================
  // ✅ ALL ROUTES UNDER /api
  //   - Admin:  /api/admin/...
  //   - Public: /api/...
  // =========================================================
  await app.register(
    async (api) => {
      // --- ADMIN ROUTES → /api/admin/...
      await api.register(registerProductsAdmin, { prefix: '/admin' });
      await api.register(registerBlogAdmin, { prefix: '/admin' });
      await api.register(registerMenuItemsAdmin, { prefix: '/admin' });
      await api.register(registerCustomPagesAdmin, { prefix: '/admin' });
      await api.register(registerSiteSettingsAdmin, { prefix: '/admin' });
      await api.register(registerAdminOrders, { prefix: '/admin' });
      await api.register(registerPaymentsAdmin, { prefix: '/admin' });
      await api.register(registerUserAdmin, { prefix: '/admin' });
      await api.register(registerEmailTemplatesAdmin, { prefix: '/admin' });
      await api.register(registerPopupsAdmin, { prefix: '/admin' });
      await api.register(registerCouponsAdmin, { prefix: '/admin' });
      await api.register(registerSupportAdmin, { prefix: '/admin' });
      await api.register(registerFooterSectionsAdmin, { prefix: '/admin' });
      await api.register(registerTopbarAdmin, { prefix: '/admin' });
      await api.register(registerFaqsAdmin, { prefix: '/admin' });
      await api.register(registerStorageAdmin, { prefix: '/admin' });
      await api.register(registerDbAdmin, { prefix: '/admin' });
      await api.register(registerContactsAdmin, { prefix: '/admin' });
      await api.register(registerFakeOrderNotificationsAdmin, { prefix: '/admin' });
      await api.register(registerTelegramWebhook, { prefix: '/admin' });
      await api.register(registerTelegramAdmin, { prefix: '/admin' });
      await api.register(registerTelegramAdminRoutes, { prefix: '/admin' });
      await api.register(registerNewsletterAdmin, { prefix: '/admin' });
      await api.register(registerWalletAdmin, { prefix: '/admin' });


      // --- PUBLIC ROUTES → /api/...
      await registerAuth(api);
      await registerRest(api);
      await registerStorage(api);
      await registerFunctions(api);
      await registerRpc(api);

      await registerProfiles(api);
      await registerCategories(api);
      await registerProducts(api);
      await registerCartItems(api);
      await registerCoupons(api);
      await registerOrders(api);

      await registerCustomPages(api);
      await registerBlog(api);
      await registerMenuItems(api);
      await registerSiteSettings(api);
      await registerPopups(api);
      await registerUserRoles(api);
      await registerTopbar(api);
      await registerFooterSections(api);

      await registerSupport(api);
      await registerWallet(api);
      await registerPayments(api);

      await registerApiProviders(api);
      await registerFaqs(api);
      await registerNotifications(api);
      await registerMail(api);
      await registerContacts(api);

      // Fake notifications (public) → /api/...
      await registerFakeOrderNotifications(api);
      await registerFakeNotificationConfig(api);
      await registerSeoRoutes(api);
      await registerNewsletter(api);
    },
    { prefix: '/api' },
  );

  // Error handlers en sonda
  registerErrorHandlers(app);
  return app;
}
