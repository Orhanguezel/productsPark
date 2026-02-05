// =============================================================
// FILE: src/modules/seo/router.ts
// FINAL — SEO module router (public)
// - mounts robots.txt + sitemap.xml + /seo/meta + manifest.json
// =============================================================

import type { FastifyInstance } from 'fastify';
import {
  robotsTxtController,
  sitemapXmlController,
  seoMetaController,
  manifestJsonController,
} from './controller';

export async function registerSeoRoutes(app: FastifyInstance) {
  // Public endpoints
  app.get('/robots.txt', robotsTxtController);
  app.get('/sitemap.xml', sitemapXmlController);
  app.get('/manifest.json', manifestJsonController);

  // Public SEO meta (flat globals)
  app.get('/seo/meta', seoMetaController);
}
