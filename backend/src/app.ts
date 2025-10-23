// src/app.ts
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';

import { env } from '@/core/env';
import { registerErrorHandlers } from '@/core/error';

// Modül router’ların importları
import { registerAuth } from '@/modules/auth/router';
import { registerRest } from '@/modules/rest/router';
import { registerStorage } from '@/modules/storage/router';
import { registerFunctions } from '@/modules/functions/router';
import { registerRpc } from '@/modules/rpc/router';
import { registerProfiles } from '@/modules/profiles/router';
import { registerCategories } from '@/modules/categories/router';
import { registerProducts } from '@/modules/products/router';
import { registerCart } from '@/modules/cart/router';
import { registerOrders } from '@/modules/orders/router';
import { registerCoupons } from '@/modules/coupons/router';
import { registerCustomPages } from '@/modules/custom-pages/router';
import { registerBlog } from '@/modules/blog/router';
import { registerMenuItems } from '@/modules/menuItems/router';
import { registerSiteSettings } from '@/modules/siteSettings/router';
import { registerPopups } from '@/modules/popups/router';
import { registerUserRoles } from "@/modules/userRoles/router";
import { registerTopbar } from '@/modules/topbarSettings/router';

export async function createApp() {
  // Dinamik import + gevşek tip: TS2349 kökten biter
  const { default: buildFastify } =
    (await import('fastify')) as unknown as {
      default: (opts?: any) => any;
    };

  const app = buildFastify({
    logger: env.NODE_ENV !== 'production',
  });

  // CORS
  await app.register(cors, {
    origin: env.CORS_ORIGIN?.length ? env.CORS_ORIGIN : true,
    credentials: true,
  });

  // Cookie
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

  // JWT (cookie'den token)
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    cookie: { cookieName: 'access_token', signed: false },
  });

  app.get('/health', async () => ({ ok: true }));

  await app.register(multipart, {
    throwFileSizeLimit: true,
    limits: { fileSize: 20 * 1024 * 1024 },
  });

  // Modüller
  await registerAuth(app);
  await registerRest(app);
  await registerStorage(app);
  await registerFunctions(app);
  await registerRpc(app);
  await registerProfiles(app);
  await registerCategories(app);
  await registerProducts(app);
  await registerCart(app);
  await registerOrders(app);
  await registerCoupons(app);
  await registerCustomPages(app);
  await registerBlog(app);
  await registerMenuItems(app);
  await registerSiteSettings(app);
  await registerPopups(app);
  await registerUserRoles(app);
  await registerTopbar(app);

  registerErrorHandlers(app);
  return app;
}
