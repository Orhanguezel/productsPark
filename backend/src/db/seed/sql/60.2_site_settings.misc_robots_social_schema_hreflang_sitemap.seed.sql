-- =============================================================
-- FILE: 60.2_site_settings.misc_robots_social_schema_hreflang_sitemap.seed.sql
-- FINAL — Misc + Robots + Social + Schema + Hreflang + Sitemap (+ Analytics IDs)
-- - Upsert by unique key
-- - JSON values stored as text (MEDIUMTEXT / TEXT)
-- - NOINDEX MODE (global): robots_meta=noindex..., robots.txt Disallow:/, sitemap_enabled=false
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO `site_settings` (`id`, `key`, `value`, `created_at`, `updated_at`) VALUES

-- ------------------------------------------------------------------
-- ASSETS / BRAND
-- ------------------------------------------------------------------
('b2f1ad0a-2f48-4b22-8b38-1b9c2c7a0004', 'favicon_url', '', NOW(3), NOW(3)),
('b2f1ad0a-2f48-4b22-8b38-1b9c2c7a0005', 'logo_url',    '', NOW(3), NOW(3)),

-- ------------------------------------------------------------------
-- CUSTOM CODES (opsiyonel)
-- ------------------------------------------------------------------
('b2f1ad0a-2f48-4b22-8b38-1b9c2c7a0002', 'custom_header_code', '', NOW(3), NOW(3)),
('b2f1ad0a-2f48-4b22-8b38-1b9c2c7a0003', 'custom_footer_code', '', NOW(3), NOW(3)),

-- ------------------------------------------------------------------
-- ANALYTICS (admin managed)
-- ------------------------------------------------------------------
('b2f1ad0a-2f48-4b22-8b38-1b9c2c7a0151', 'analytics_ga_id',  '', NOW(3), NOW(3)),
('b2f1ad0a-2f48-4b22-8b38-1b9c2c7a0152', 'analytics_gtm_id', '', NOW(3), NOW(3)),

-- ------------------------------------------------------------------
-- ROBOTS META + ROBOTS.TXT (admin managed)
-- robots_meta: "index,follow" OR "noindex,nofollow"
-- ------------------------------------------------------------------
('b2f1ad0a-2f48-4b22-8b38-1b9c2c7a0201', 'robots_meta',        'noindex,nofollow,noarchive,nosnippet', NOW(3), NOW(3)),
('b2f1ad0a-2f48-4b22-8b38-1b9c2c7a0202', 'robots_txt_enabled', 'true',          NOW(3), NOW(3)),
('b2f1ad0a-2f48-4b22-8b38-1b9c2c7a0203', 'robots_txt_content',
'User-agent: *
Disallow: /
', NOW(3), NOW(3)),

-- ------------------------------------------------------------------
-- CANONICAL + HREFLANG
-- ------------------------------------------------------------------
('b2f1ad0a-2f48-4b22-8b38-1b9c2c7a0301', 'canonical_base_url', '',      NOW(3), NOW(3)),
('b2f1ad0a-2f48-4b22-8b38-1b9c2c7a0302', 'hreflang_enabled',   'false', NOW(3), NOW(3)),
('b2f1ad0a-2f48-4b22-8b38-1b9c2c7a0303', 'hreflang_locales',
'[
  { "locale": "tr", "prefix": "" }
]', NOW(3), NOW(3)),

-- ------------------------------------------------------------------
-- SOCIAL (OG + Twitter)
-- ------------------------------------------------------------------
('b2f1ad0a-2f48-4b22-8b38-1b9c2c7a0401', 'og_site_name',      'Dijimins', NOW(3), NOW(3)),
('b2f1ad0a-2f48-4b22-8b38-1b9c2c7a0402', 'og_default_image',  '',        NOW(3), NOW(3)),
('b2f1ad0a-2f48-4b22-8b38-1b9c2c7a0403', 'twitter_site',      '',        NOW(3), NOW(3)),
('b2f1ad0a-2f48-4b22-8b38-1b9c2c7a0404', 'twitter_card',      'summary_large_image', NOW(3), NOW(3)),

-- ------------------------------------------------------------------
-- VERIFICATION
-- ------------------------------------------------------------------
('b2f1ad0a-2f48-4b22-8b38-1b9c2c7a0501', 'google_site_verification', '', NOW(3), NOW(3)),
('b2f1ad0a-2f48-4b22-8b38-1b9c2c7a0502', 'bing_site_verification',   '', NOW(3), NOW(3)),

-- ------------------------------------------------------------------
-- SCHEMA.ORG (JSON-LD text)
-- schema_org_enabled: "true" / "false"
-- ------------------------------------------------------------------
('b2f1ad0a-2f48-4b22-8b38-1b9c2c7a0601', 'schema_org_enabled', 'false', NOW(3), NOW(3)),
('b2f1ad0a-2f48-4b22-8b38-1b9c2c7a0602', 'schema_org_organization',
'{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Dijimins",
  "url": "",
  "logo": ""
}', NOW(3), NOW(3)),
('b2f1ad0a-2f48-4b22-8b38-1b9c2c7a0603', 'schema_org_website',
'{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Dijimins",
  "url": "",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "/urunler?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}', NOW(3), NOW(3)),

-- ------------------------------------------------------------------
-- SITEMAP (Admin panelden dinamik yönetim)
-- NOTE: NOINDEX MODE => sitemap_enabled=false
-- ------------------------------------------------------------------
('b2f1ad0a-2f48-4b22-8b38-1b9c2c7a0101', 'sitemap_enabled',  'false', NOW(3), NOW(3)),
('b2f1ad0a-2f48-4b22-8b38-1b9c2c7a0102', 'sitemap_base_url', '',     NOW(3), NOW(3)),
('b2f1ad0a-2f48-4b22-8b38-1b9c2c7a0103', 'sitemap_urls',
'[
  { "path": "/",            "changefreq": "daily",   "priority": 1.0 },
  { "path": "/urunler",     "changefreq": "daily",   "priority": 0.9 },
  { "path": "/kategoriler", "changefreq": "weekly",  "priority": 0.8 },
  { "path": "/blog",        "changefreq": "weekly",  "priority": 0.7 },
  { "path": "/kampanyalar", "changefreq": "weekly",  "priority": 0.7 },
  { "path": "/hakkimizda",  "changefreq": "monthly", "priority": 0.5 },
  { "path": "/iletisim",    "changefreq": "monthly", "priority": 0.5 },
  { "path": "/sss",         "changefreq": "monthly", "priority": 0.4 },
  { "path": "/kullanim-sartlari", "changefreq": "yearly", "priority": 0.3 },
  { "path": "/gizlilik-politikasi", "changefreq": "yearly", "priority": 0.3 }
]', NOW(3), NOW(3))

ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);
