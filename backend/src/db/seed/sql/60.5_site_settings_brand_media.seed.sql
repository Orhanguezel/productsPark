-- =============================================================
-- FILE: 60.5_site_settings_brand_media.seed.sql
-- Additional Brand Media Settings - PWA Icons, Apple Touch Icon
-- - Upsert by unique key (site_settings.key)
-- - Values stored as text (URL strings)
--
-- NOTE: light_logo, dark_logo, favicon_url, logo_url, og_default_image
--       already exist in 60.1 and 60.2 seed files
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO `site_settings` (`id`, `key`, `value`, `created_at`, `updated_at`) VALUES

-- ------------------------------------------------------------------
-- APPLE TOUCH ICON
-- iOS cihazlarda ana ekrana eklendiğinde görünecek ikon (180x180 px)
-- ------------------------------------------------------------------
('bm04a1b2-c3d4-e5f6-a7b8-c9d0e1f2a3b4', 'apple_touch_icon', '', NOW(3), NOW(3)),

-- ------------------------------------------------------------------
-- PWA ICONS
-- Progressive Web App manifest için gerekli ikonlar
-- ------------------------------------------------------------------
('bm05a1b2-c3d4-e5f6-a7b8-c9d0e1f2a3b5', 'pwa_icon_192', '', NOW(3), NOW(3)),
('bm05a1b2-c3d4-e5f6-a7b8-c9d0e1f2a3b6', 'pwa_icon_512', '', NOW(3), NOW(3)),

-- ------------------------------------------------------------------
-- PWA COLORS
-- PWA manifest için tema ve arkaplan renkleri
-- ------------------------------------------------------------------
('bm06a1b2-c3d4-e5f6-a7b8-c9d0e1f2a3b7', 'pwa_theme_color', '#000000', NOW(3), NOW(3)),
('bm06a1b2-c3d4-e5f6-a7b8-c9d0e1f2a3b8', 'pwa_background_color', '#ffffff', NOW(3), NOW(3))

ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);
