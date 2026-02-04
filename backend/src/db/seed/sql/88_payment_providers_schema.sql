-- ===================================================================
-- 88_payment_providers_schema.sql (FINAL + SAFE SEED)
-- - No DROP (data loss yok)
-- - paytr public_config: ok_url, fail_url, notification_url, test_mode
-- - shopier ACTIVE (is_active=1)
-- ===================================================================

CREATE TABLE IF NOT EXISTS `payment_providers` (
  `id`             CHAR(36)      NOT NULL,
  `key`            VARCHAR(64)   NOT NULL,
  `display_name`   VARCHAR(128)  NOT NULL,
  `is_active`      TINYINT       NOT NULL DEFAULT 1,

  `public_config`  TEXT                   DEFAULT NULL,
  `secret_config`  TEXT                   DEFAULT NULL,

  `created_at`     DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`     DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `payment_providers_key_uq` (`key`),
  KEY `payment_providers_active_idx` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- SEED (idempotent upsert)
-- ----------------------------

INSERT INTO `payment_providers`
(`id`,`key`,`display_name`,`is_active`,`public_config`,`secret_config`,`created_at`,`updated_at`)
VALUES
(
  '11111111-1111-1111-1111-111111111111',
  'paytr',
  'PayTR Kredi Kartı',
  1,
  '{"mode":"test","type":"card","commission":2.50,"ok_url":"http://localhost:3000/odeme-basarili","fail_url":"http://localhost:3000/odeme-basarisiz","notification_url":"http://localhost:8081/api/paytr/notify","test_mode":1}',
  '{"merchant_id":"xxx","merchant_key":"yyy","merchant_salt":"zzz"}',
  NOW(3),
  NOW(3)
),
(
  '22222222-2222-2222-2222-222222222222',
  'bank_transfer',
  'Banka Havale / EFT',
  1,
  '{"type":"bank_transfer","methods":["havale","eft"],"commission":0,"havale":{"iban":"TR00 0000 0000 0000 0000 0000 00","account_holder":"Company Name","bank_name":"Bank Name"},"eft":{"iban":"TR00 0000 0000 0000 0000 0000 00","account_holder":"Company Name","bank_name":"Bank Name"}}',
  NULL,
  NOW(3),
  NOW(3)
),
(
  '33333333-3333-3333-3333-333333333333',
  'shopier',
  'Shopier',
  1,
  '{"mode":"test","type":"card","commission":0}',
  '{"api_key":"xxx","secret":"yyy","website_index":1}',
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `display_name`  = VALUES(`display_name`),
  `is_active`     = VALUES(`is_active`),
  `public_config` = VALUES(`public_config`),
  `secret_config` = VALUES(`secret_config`),
  `updated_at`    = VALUES(`updated_at`);
