-- =============================================================
-- COUPONS SCHEMA
-- =============================================================
SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS `coupons` (
  `id`             CHAR(36)      NOT NULL,
  `code`           VARCHAR(50)   NOT NULL,
  `title`          VARCHAR(200)  DEFAULT NULL,
  `content_html`   MEDIUMTEXT    DEFAULT NULL,
  `discount_type`  ENUM('percentage','fixed') NOT NULL,
  `discount_value` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `min_purchase`   DECIMAL(10,2) DEFAULT NULL,
  `max_discount`   DECIMAL(10,2) DEFAULT NULL,
  `usage_limit`    INT           DEFAULT NULL,
  `per_user_limit` INT           DEFAULT NULL,
  `used_count`     INT           NOT NULL DEFAULT 0,

  `applicable_to`  ENUM('all','category','product') NOT NULL DEFAULT 'all',
  `category_ids`   TEXT         DEFAULT NULL,
  `product_ids`    TEXT         DEFAULT NULL,

  `valid_from`     DATETIME(3)  DEFAULT NULL,
  `valid_until`    DATETIME(3)  DEFAULT NULL,
  `is_active`      TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `coupons_code_uq` (`code`),
  KEY `coupons_active_idx` (`is_active`),
  KEY `coupons_valid_from_idx` (`valid_from`),
  KEY `coupons_valid_until_idx` (`valid_until`),
  KEY `coupons_applicable_idx` (`applicable_to`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================
-- COUPONS SEED
-- UUID planı:
--   a1b2c3d4-e5f6-7890-abcd-ef1234500001  HOSGELDIN10  (topbar + popup bağlı)
--   a1b2c3d4-e5f6-7890-abcd-ef1234500002  YAZILIM15    (popup bağlı)
--   a1b2c3d4-e5f6-7890-abcd-ef1234500003  SOSYAL10     (popup bağlı)
--   a1b2c3d4-e5f6-7890-abcd-ef1234500004  OYUN20       (popup bağlı)
--   a1b2c3d4-e5f6-7890-abcd-ef1234500005  INDIRIM50
--   a1b2c3d4-e5f6-7890-abcd-ef1234500006  VIP25
--   a1b2c3d4-e5f6-7890-abcd-ef1234500007  FLASH30
--   07e668cd-2f84-4182-a35e-f55cebf893d8  2025         (eski kayıt)
-- =============================================================
SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO `coupons`
(`id`, `code`, `title`, `content_html`,
 `discount_type`, `discount_value`, `min_purchase`, `max_discount`,
 `usage_limit`, `used_count`,
 `applicable_to`, `category_ids`, `product_ids`,
 `valid_from`, `valid_until`, `is_active`,
 `created_at`, `updated_at`)
VALUES

-- 1) HOSGELDIN10 — topbar + popup ile bağlı; yeni üyelere %10
('a1b2c3d4-e5f6-7890-abcd-ef1234500001',
 'HOSGELDIN10',
 'Hoş Geldin İndirimi – %10',
 '<p>Sitemize hoş geldiniz! İlk siparişinizde <strong>%10 indirim</strong> kazanın.</p>
<ul>
  <li>Tüm ürünlerde geçerlidir.</li>
  <li>Minimum sepet tutarı: <strong>100 ₺</strong></li>
  <li>Ödeme adımında kupon kodunu girerek indirimi uygulayın.</li>
</ul>',
 'percentage', 10.00, 100.00, NULL,
 NULL, 0, 'all', NULL, NULL,
 NULL, NULL, 1, NOW(3), NOW(3)),

-- 2) YAZILIM15 — popup ile bağlı; yazılım lisansları %15
('a1b2c3d4-e5f6-7890-abcd-ef1234500002',
 'YAZILIM15',
 'Yazılım Lisanslarında %15 İndirim',
 '<p>Windows, Office ve tüm yazılım lisanslarında <strong>%15 indirim</strong>!</p>
<ul>
  <li>Minimum sepet tutarı: <strong>200 ₺</strong></li>
  <li>Haftalık yenilenen kampanya.</li>
</ul>',
 'percentage', 15.00, 200.00, NULL,
 NULL, 0, 'all', NULL, NULL,
 NULL, NULL, 1, NOW(3), NOW(3)),

-- 3) SOSYAL10 — popup ile bağlı; sosyal medya paketleri %10
('a1b2c3d4-e5f6-7890-abcd-ef1234500003',
 'SOSYAL10',
 'Sosyal Medya Paketlerinde %10 İndirim',
 '<p>Instagram, TikTok, YouTube takipçi ve beğeni paketlerinde <strong>%10 indirim</strong>!</p>
<ul>
  <li>Minimum sepet tutarı: <strong>50 ₺</strong></li>
  <li>Günlük yenilenen kampanya.</li>
</ul>',
 'percentage', 10.00, 50.00, NULL,
 NULL, 0, 'all', NULL, NULL,
 NULL, NULL, 1, NOW(3), NOW(3)),

-- 4) OYUN20 — popup ile bağlı; oyun anahtarları %20
('a1b2c3d4-e5f6-7890-abcd-ef1234500004',
 'OYUN20',
 'Oyun Keylerinde %20 İndirim',
 '<p>Steam, Epic Games ve tüm oyun anahtarlarında <strong>%20 indirim</strong>!</p>
<ul>
  <li>Minimum sepet tutarı: <strong>150 ₺</strong></li>
  <li>Kodu ödeme sayfasında girin.</li>
</ul>',
 'percentage', 20.00, 150.00, NULL,
 NULL, 0, 'all', NULL, NULL,
 NULL, NULL, 1, NOW(3), NOW(3)),

-- 5) INDIRIM50 — sabit 50 TL indirim, 500 TL üzeri
('a1b2c3d4-e5f6-7890-abcd-ef1234500005',
 'INDIRIM50',
 '500 ₺ Üzeri Siparişlerde 50 ₺ İndirim',
 '<p>Toplam sepet tutarı <strong>500 ₺</strong> ve üzerinde doğrudan <strong>50 ₺ indirim</strong>!</p>',
 'fixed', 50.00, 500.00, NULL,
 NULL, 0, 'all', NULL, NULL,
 NULL, NULL, 1, NOW(3), NOW(3)),

-- 6) VIP25 — özel üyelere %25, max 200 TL indirim
('a1b2c3d4-e5f6-7890-abcd-ef1234500006',
 'VIP25',
 'VIP Üyelere Özel %25 İndirim',
 '<p>Değerli müşterilerimize özel <strong>%25 indirim</strong> kuponu!</p>
<ul>
  <li>Minimum sepet tutarı: <strong>300 ₺</strong></li>
  <li>Maksimum indirim tutarı: <strong>200 ₺</strong></li>
  <li>Tüm kategorilerde geçerli.</li>
</ul>',
 'percentage', 25.00, 300.00, 200.00,
 NULL, 0, 'all', NULL, NULL,
 NULL, NULL, 1, NOW(3), NOW(3)),

-- 7) FLASH30 — sınırlı kullanım (100 kişi), %30 indirim
('a1b2c3d4-e5f6-7890-abcd-ef1234500007',
 'FLASH30',
 'Flash Kampanya – %30 İndirim (İlk 100 Kişi)',
 '<p>Sadece <strong>ilk 100 kullanım</strong> için geçerli <strong>%30 flash indirim</strong>!</p>
<p>Kaçırmayın, stoklar sınırlı!</p>',
 'percentage', 30.00, 100.00, 150.00,
 100, 0, 'all', NULL, NULL,
 NULL, NULL, 1, NOW(3), NOW(3)),

-- 8) 2025 — eski kayıt, güncellendi ve aktifleştirildi
('07e668cd-2f84-4182-a35e-f55cebf893d8',
 '2025',
 '2025 Yılbaşı İndirimi – %25',
 '<p>Yeni yıla özel, 500 ₺ ve üzeri alışverişlerde <strong>%25 indirim</strong>!</p>',
 'percentage', 25.00, 500.00, NULL,
 NULL, 3, 'all', NULL, NULL,
 NULL, NULL, 1,
 '2025-10-07 13:17:24.000', NOW(3))

ON DUPLICATE KEY UPDATE
  `title`          = VALUES(`title`),
  `content_html`   = VALUES(`content_html`),
  `discount_type`  = VALUES(`discount_type`),
  `discount_value` = VALUES(`discount_value`),
  `min_purchase`   = VALUES(`min_purchase`),
  `max_discount`   = VALUES(`max_discount`),
  `usage_limit`    = VALUES(`usage_limit`),
  `applicable_to`  = VALUES(`applicable_to`),
  `valid_from`     = VALUES(`valid_from`),
  `valid_until`    = VALUES(`valid_until`),
  `is_active`      = VALUES(`is_active`),
  `updated_at`     = VALUES(`updated_at`);
