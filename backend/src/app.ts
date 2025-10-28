import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import authPlugin from "./plugins/authPlugin";

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
import { registerWalletTransactions } from "@/modules/wallet_transactions/router";
import { registerWalletDeposits } from "@/modules/wallet_deposit_requests/router";
import { registerPayments } from '@/modules/payments/router';
import { registerProductsAdmin } from "@/modules/products/admin.routes";

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
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Prefer'],
    exposedHeaders: ['x-total-count', 'content-range'],
    // preflight varsayılanı true -> plugin kendi OPTIONS /* rotasını ekler
  });

  // ❌ ÇAKIŞMA YAPTIĞI İÇİN SİLİNDİ:
  // app.options('/*', async (req, reply) => { ... });

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

  // Public health
  app.get('/health', async () => ({ ok: true }));

  // Multipart
  await app.register(multipart, {
    throwFileSizeLimit: true,
    limits: { fileSize: 20 * 1024 * 1024 },
  });

  // Modüller
  await registerProductsAdmin(app);
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
  await registerWalletTransactions(app);
  await registerWalletDeposits(app);
  await registerPayments(app);

  registerErrorHandlers(app);
  return app;
}
