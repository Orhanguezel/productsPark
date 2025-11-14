-- =============================================================
-- TOPBAR SETTINGS SCHEMA
-- =============================================================
SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS `topbar_settings` (
  `id`           CHAR(36)     NOT NULL,
  `text`         VARCHAR(255) NOT NULL,
  `link`         VARCHAR(500) DEFAULT NULL,
  `coupon_id`    CHAR(36)     DEFAULT NULL,
  `is_active`    TINYINT(1)   NOT NULL DEFAULT 0,
  `show_ticker`  TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `topbar_settings_active_idx`  (`is_active`),
  KEY `topbar_settings_created_idx` (`created_at`),
  -- 🔍 Kupon ilişkisi için index
  KEY `topbar_settings_coupon_idx`  (`coupon_id`),
  CONSTRAINT `fk_topbar_coupon`
    FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- TOPBAR SETTINGS SEED
-- =============================================================
SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO `topbar_settings`
(`id`,`text`,`link`,`coupon_id`,`is_active`,`show_ticker`,`created_at`,`updated_at`) VALUES
('07bf8399-21fe-47fe-909d-9b6174bb4970','Üye Ol %10 İndirim Kazan','/coupon',NULL,1,0,'2025-10-09 19:09:07.000','2025-10-09 19:09:07.000')
ON DUPLICATE KEY UPDATE
  `text`        = VALUES(`text`),
  `link`        = VALUES(`link`),
  `coupon_id`   = VALUES(`coupon_id`),
  `is_active`   = VALUES(`is_active`),
  `show_ticker` = VALUES(`show_ticker`),
  `updated_at`  = VALUES(`updated_at`);
