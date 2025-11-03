-- =============================================================
-- FILE: 72_blog_posts_schema.sql
-- Idempotent schema aligned with src/modules/blog/schema.ts
-- =============================================================

-- NOTE:
-- - Runner tam drop yapıyorsa burada DROP kullanmıyoruz.
-- - Yoksa oluştur, varsa kolon/tip/index normalizasyonu uygula.
-- - MySQL 8.0.21+ için IF NOT EXISTS destekleri kullanıldı.

CREATE TABLE IF NOT EXISTS `blog_posts` (
  `id`                         char(36)       NOT NULL,
  `title`                      varchar(255)   NOT NULL,
  `slug`                       varchar(255)   NOT NULL,
  `excerpt`                    varchar(500)            DEFAULT NULL,
  `content`                    text           NOT NULL,

  -- Eski alan (URL) – geriye dönük
  `featured_image`             varchar(500)            DEFAULT NULL,

  -- Yeni alanlar: storage ile bağ
  `featured_image_asset_id`    char(36)                DEFAULT NULL,
  `featured_image_alt`         varchar(255)            DEFAULT NULL,

  `author`                     varchar(100)            DEFAULT NULL,
  `meta_title`                 varchar(255)            DEFAULT NULL,
  `meta_description`           varchar(500)            DEFAULT NULL,
  `is_published`               tinyint(1)     NOT NULL DEFAULT 0,
  `published_at`               datetime(3)             DEFAULT NULL,
  `created_at`                 datetime(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`                 datetime(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `blog_posts_slug_uq` (`slug`),
  KEY `blog_posts_created_idx`      (`created_at`),
  KEY `blog_posts_published_idx`    (`published_at`),
  KEY `blog_posts_is_published_idx` (`is_published`),
  KEY `blog_posts_featured_asset_idx` (`featured_image_asset_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
