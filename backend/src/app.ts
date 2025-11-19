import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import authPlugin from "./plugins/authPlugin";
import mysqlPlugin from '@/plugins/mysql';

import type { FastifyInstance } from 'fastify';
import { env } from '@/core/env';
import { registerErrorHandlers } from '@/core/error';

// Modüller
import { registerAuth } from '@/modules/auth/router';
import { registerRest } from '@/modules/rest/router';
import { registerStorage } from '@/modules/storage/router';
import { registerFunctions } from '@/modules/functions/router';
import { registerRpc } from '@/modules/rpc/router';
import { registerProfiles } from '@/modules/profiles/router';
import { registerCategories } from '@/modules/categories/router';
import { registerProducts } from '@/modules/products/router';
import { registerCartItems } from "@/modules/cart/router";
import { registerCoupons } from "@/modules/coupons/router";
import { registerOrders } from '@/modules/orders/router';
import { registerCustomPages } from '@/modules/customPages/router';
import { registerBlog } from '@/modules/blog/router';
import { registerMenuItems } from '@/modules/menuItems/router';
import { registerSiteSettings } from '@/modules/siteSettings/router';
import { registerPopups } from '@/modules/popups/router';
import { registerUserRoles } from "@/modules/userRoles/router";
import { registerTopbar } from '@/modules/topbarSettings/router';
import { registerFooterSections } from "@/modules/footerSections/router";
import { registerSupport } from "@/modules/support/router";
import { registerWallet } from "@/modules/wallet/router";
import { registerPayments } from '@/modules/payments/router';
import { registerFaqs } from '@/modules/faqs/router';
import { registerNotifications } from "@/modules/notifications/router";
import { registerMail } from "@/modules/mail/router";
import { registerContacts } from "@/modules/contact/router";


import { registerProductsAdmin } from "@/modules/products/admin.routes";
import { registerBlogAdmin } from "@/modules/blog/admin.routes";
import { registerMenuItemsAdmin } from "@/modules/menuItems/admin.routes";
import { registerCustomPagesAdmin } from "@/modules/customPages/admin.routes";
import { registerSiteSettingsAdmin } from '@/modules/siteSettings/admin.routes';
import { registerAdminOrders } from '@/modules/orders/admin.routes';
import { registerPaymentsAdmin } from "@/modules/payments/admin.routes";
import { registerUserAdmin } from "@/modules/auth/admin.routes";
import { registerEmailTemplatesAdmin } from "@/modules/email-templates/admin.routes";
import { registerPopupsAdmin } from '@/modules/popups/admin.routes';
import { registerCouponsAdmin } from "@/modules/coupons/admin.routes";
import { registerSupportAdmin } from "@/modules/support/admin.routes";
import { registerApiProviders } from "@/modules/api_providers/router";
import { registerFooterSectionsAdmin } from "@/modules/footerSections/admin.routes";
import { registerTopbarAdmin } from "@/modules/topbarSettings/admin.routes";
import { registerFakeNotificationConfig } from './modules/siteSettings/fakeNotificationConfig.router';
import { registerFakeOrderNotifications } from './modules/fakeOrderNotifications/router';
import { registerFaqsAdmin} from '@/modules/faqs/admin.routes';
import { registerStorageAdmin } from '@/modules/storage/admin.routes';
import { registerDbAdmin } from '@/modules/db_admin/admin.routes';
import { registerContactsAdmin } from "@/modules/contact/admin.routes";

function parseCorsOrigins(v?: string | string[]): boolean | string[] {
  if (!v) return true;
  if (Array.isArray(v)) return v;
  const s = String(v).trim();
  if (!s) return true;
  const arr = s.split(",").map(x => x.trim()).filter(Boolean);
  return arr.length ? arr : true;
}

export async function createApp() {
  const { default: buildFastify } =
    (await import('fastify')) as unknown as {
      default: (opts?: Parameters<FastifyInstance['log']['child']>[0]) => FastifyInstance
    };

  const app = buildFastify({
    logger: env.NODE_ENV !== 'production',
  }) as FastifyInstance;

  // --- CORS ---
  await app.register(cors, {
  origin: parseCorsOrigins(env.CORS_ORIGIN as any),
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
  ],
  exposedHeaders: ['x-total-count', 'content-range', 'range'],
});




  // --- Cookie ---
  const cookieSecret =
    (globalThis as any).Bun?.env?.COOKIE_SECRET ??
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

  // 🔒 Guard
  await app.register(authPlugin);
  // 🗄️ MySQL
  await app.register(mysqlPlugin);

  // Public health
  app.get('/health', async () => ({ ok: true }));

  // Multipart
  await app.register(multipart, {
    throwFileSizeLimit: true,
    limits: { fileSize: 20 * 1024 * 1024 },
  });

  // Modüller
  await registerProductsAdmin(app);
  await registerBlogAdmin(app);
  await registerMenuItemsAdmin(app);
  await registerCustomPagesAdmin(app);
  await registerSiteSettingsAdmin(app);
  await registerAdminOrders(app);
  await registerPaymentsAdmin(app);
  await registerUserAdmin(app);
  await registerEmailTemplatesAdmin(app);
  await registerPopupsAdmin(app);
  await registerCouponsAdmin(app);
  await registerSupportAdmin(app);
  await registerFooterSectionsAdmin(app);
  await registerTopbarAdmin(app);
  await registerFaqsAdmin(app);
  await registerStorageAdmin(app);
  await registerDbAdmin(app);
  await registerContactsAdmin(app);


  await registerFakeOrderNotifications(app);
  await registerFakeNotificationConfig(app);
  await registerAuth(app);
  await registerRest(app);
  await registerStorage(app);
  await registerFunctions(app);
  await registerRpc(app);
  await registerProfiles(app);
  await registerCategories(app);
  await registerProducts(app);
  await registerCartItems(app);
  await registerOrders(app);
  await registerCustomPages(app);
  await registerBlog(app);
  await registerMenuItems(app);
  await registerSiteSettings(app);
  await registerPopups(app);
  await registerUserRoles(app);
  await registerTopbar(app);
  await registerCoupons(app);
  await registerFooterSections(app);
  await registerSupport(app);
  await registerWallet(app);
  await registerPayments(app);
  await registerApiProviders(app);
  await registerFaqs(app);
  await registerNotifications(app);
  await registerMail(app);
  await registerContacts(app);

  registerErrorHandlers(app);
  return app;
}
