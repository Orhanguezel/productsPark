-- =============================================================
-- FILE: 72_blog_posts_schema.sql
-- Idempotent schema aligned with src/modules/blog/schema.ts
-- =============================================================

-- NOTE:
-- - This file is safe with both "drop+create" runs and "--no-drop" runs.
-- - We DO NOT drop the table here; runner already handles full DB drop when needed.
-- - We create the table if missing, then normalize critical columns to DATETIME(3).

CREATE TABLE IF NOT EXISTS `blog_posts` (
  `id`              char(36)       NOT NULL,
  `title`           varchar(255)   NOT NULL,
  `slug`            varchar(255)   NOT NULL,
  `excerpt`         varchar(500)            DEFAULT NULL,
  `content`         text           NOT NULL,
  `featured_image`  varchar(500)            DEFAULT NULL,
  `author`          varchar(100)            DEFAULT NULL,
  `meta_title`      varchar(255)            DEFAULT NULL,
  `meta_description`varchar(500)            DEFAULT NULL,
  `is_published`    tinyint(1)     NOT NULL DEFAULT 0,
  `published_at`    datetime(3)             DEFAULT NULL,
  `created_at`      datetime(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`      datetime(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `blog_posts_slug_uq` (`slug`),
  KEY `blog_posts_created_idx`      (`created_at`),
  KEY `blog_posts_published_idx`    (`published_at`),
  KEY `blog_posts_is_published_idx` (`is_published`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ensure timestamp precision & defaults even if table already existed
ALTER TABLE `blog_posts`
  MODIFY COLUMN `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  MODIFY COLUMN `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  MODIFY COLUMN `published_at` datetime(3) NULL;
