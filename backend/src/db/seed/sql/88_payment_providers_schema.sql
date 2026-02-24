-- ===================================================================
-- 88_payment_providers_schema.sql (FINAL + SAFE SEED)
-- - No DROP (data loss yok)
-- - paytr public_config: ok_url, fail_url, notification_url, test_mode
-- - shopier INACTIVE (is_active=0) — gerçek credentials eklenince 1 yap
--
-- ⚠️  UYARI: Schema değişikliklerini SADECE bu seed dosyasında yap.
--    Asla doğrudan ALTER TABLE çalıştırma — prod'da seed ile taşınır.
-- ===================================================================

CREATE TABLE IF NOT EXISTS `payment_providers` (
  `id`             CHAR(36)      NOT NULL,
  `key`            VARCHAR(64)   NOT NULL,
  `display_name`   VARCHAR(128)  NOT NULL,
  `logo_url`       VARCHAR(500)           DEFAULT NULL,
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
(`id`,`key`,`display_name`,`logo_url`,`is_active`,`public_config`,`secret_config`,`created_at`,`updated_at`)
VALUES
(
  '11111111-1111-1111-1111-111111111111',
  'paytr',
  'PayTR Kredi Kartı',
  'https://res.cloudinary.com/dbozv7wqd/image/upload/v1771944908/payments/logos/PayTR.png',
  1,
  '{"mode":"test","type":"card","commission":2.50,"ok_url":"http://localhost:3000/odeme-basarili","fail_url":"http://localhost:3000/odeme-basarisiz","notification_url":"http://localhost:8081/api/paytr/notify","test_mode":1}',
  '{"merchant_id":"673164","merchant_key":"yyy","merchant_salt":"zzz"}',
  NOW(3),
  NOW(3)
),
(
  '22222222-2222-2222-2222-222222222222',
  'bank_transfer',
  'Banka Havale / EFT',
  'https://res.cloudinary.com/dbozv7wqd/image/upload/v1771944043/payments/logos/havale1.png',
  1,
  '{"type":"bank_transfer","methods":["havale","eft"],"commission":0,"havale":{"iban":"TR00 0000 0000 0000 0000 0000 00","account_holder":"Company Name","bank_name":"Bank Name"},"eft":{"iban":"TR00 0000 0000 0000 0000 0000 12","account_holder":"Company Name","bank_name":"Bank Name"}}',
  NULL,
  NOW(3),
  NOW(3)
),
(
  '33333333-3333-3333-3333-333333333333',
  'shopier',
  'Shopier',
  'https://res.cloudinary.com/dbozv7wqd/image/upload/v1771944923/payments/logos/Shopier.png',
  0,
  '{"mode":"live","type":"card","commission":0,"ok_url":"http://localhost:3000/odeme-basarili","fail_url":"http://localhost:3000/odeme-basarisiz","notification_url":"https://YOURDOMAIN.com/api/shopier/notify"}',
  '{"api_key":"SHOPIER_API_KEY","secret":"SHOPIER_SECRET","website_index":1}',
  NOW(3),
  NOW(3)
),
(
  '44444444-4444-4444-4444-444444444444',
  'stripe',
  'Stripe Kredi Kartı',
  'https://res.cloudinary.com/dbozv7wqd/image/upload/v1771944938/payments/logos/stripe.png',
  1,
  '{"mode":"test","type":"card","commission":0,"ok_url":"http://localhost:3000/odeme-basarili","fail_url":"http://localhost:3000/odeme-basarisiz","notification_url":"http://localhost:8081/api/stripe/webhook"}',
  '{"secret_key":"","webhook_secret":""}',
  NOW(3),
  NOW(3)
),
(
  '66666666-6666-6666-6666-666666666666',
  'wallet',
  'Cüzdan ile Ödeme',
  'https://res.cloudinary.com/dbozv7wqd/image/upload/v1771944938/payments/logos/wallet1.png',
  1,
  '{"type":"wallet","commission":0}',
  NULL,
  NOW(3),
  NOW(3)
),
(
  '55555555-5555-5555-5555-555555555555',
  'papara',
  'Papara',
  'https://res.cloudinary.com/dbozv7wqd/image/upload/v1771944958/payments/logos/PAPARA.png',
  0,
  '{"type":"wallet","commission":0,"test_mode":0,"notification_url":"https://YOURDOMAIN.com/api/papara/notify","redirect_url":"http://localhost:3000/odeme-basarili","fail_url":"http://localhost:3000/odeme-basarisiz","ok_url":"http://localhost:3000/odeme-basarili"}',
  '{"api_key":"PAPARA_API_KEY"}',
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `display_name`  = VALUES(`display_name`),
  `logo_url`      = VALUES(`logo_url`),
  `is_active`     = VALUES(`is_active`),
  `public_config` = VALUES(`public_config`),
  `secret_config` = VALUES(`secret_config`),
  `updated_at`    = VALUES(`updated_at`);
