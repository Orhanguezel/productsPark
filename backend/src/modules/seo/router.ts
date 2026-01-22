// =============================================================
// FILE: src/modules/seo/router.ts
// FINAL — SEO module router (public)
// - mounts robots.txt + sitemap.xml + /seo/meta
// =============================================================

import type { FastifyInstance } from 'fastify';
import { robotsTxtController, sitemapXmlController, seoMetaController } from './controller';

export async function registerSeoRoutes(app: FastifyInstance) {
  // Public endpoints
  app.get('/robots.txt', robotsTxtController);
  app.get('/sitemap.xml', sitemapXmlController);

  // Public SEO meta (flat globals)
  app.get('/seo/meta', seoMetaController);
}
