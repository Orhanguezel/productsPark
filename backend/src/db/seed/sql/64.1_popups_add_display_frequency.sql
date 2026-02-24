-- =============================================================
-- MIGRATION: popups tablosuna display_frequency kolonu ekle
-- Mevcut veriler korunur (DROP TABLE YOK)
-- =============================================================
SET NAMES utf8mb4;

-- Kolon yoksa ekle (idempotent)
ALTER TABLE `popups`
  ADD COLUMN IF NOT EXISTS `display_frequency` VARCHAR(16) NOT NULL DEFAULT 'always'
    COMMENT 'always|once|daily|weekly'
    AFTER `show_once`;

-- Mevcut kayıtları show_once'a göre güncelle
UPDATE `popups`
SET `display_frequency` = 'once'
WHERE `show_once` = 1 AND `display_frequency` = 'always';

-- =============================================================
-- Mevcut popupları aktif et ve resim/içerik güncelle
-- (ON DUPLICATE KEY UPDATE ile güvenli)
-- =============================================================
INSERT INTO `popups`
(`id`, `title`, `content`,
 `image_url`, `image_asset_id`, `image_alt`,
 `button_text`, `button_url`,
 `is_active`, `show_once`, `display_frequency`, `delay`,
 `valid_from`, `valid_until`,
 `product_id`, `coupon_code`, `display_pages`, `priority`, `duration_seconds`,
 `created_at`, `updated_at`)
VALUES

-- 1) Üyelik/ilk sipariş – aktifleştir + resim + once
('b57879a1-bdb0-4ccd-90a6-fae11d42850b',
 'Üye Ol, İlk Siparişinde %10 İndirim Kazan!',
 'Sitemize üye olarak yapacağınız ilk siparişlerde geçerli özel indirim kodunuz hazır. Hemen kayıt olun, fırsatı kaçırmayın!',
 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80',
 NULL, 'Alışveriş kampanya görseli',
 'Ücretsiz Üye Ol', '/kayit',
 1, 1, 'once', 3,
 NULL, NULL,
 NULL, 'HOSGELDIN10', 'all', 90, 0,
 NOW(3), NOW(3)),

-- 2) Genel kampanya – aktifleştir + resim + daily, tarih sıfırla
('caa4a1c1-9f39-4a64-8d34-0e2f6b4fbd77',
 'Bu Ay Özel Fırsatlar Sizi Bekliyor!',
 'Dijital ürünlerde büyük indirimler! Oyun anahtarları, yazılım lisansları ve daha fazlası için hemen göz atın.',
 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
 NULL, 'Kampanya görseli',
 'Fırsatları Keşfet', '/urunler',
 1, 0, 'daily', 2,
 NULL, NULL,
 NULL, NULL, 'home', 80, 15,
 NOW(3), NOW(3)),

-- 3) Kupon popup – aktifleştir + resim + weekly, tarih sıfırla
('9a7f1a4b-0a56-4c1a-8f41-2f7b0f8d3c9e',
 'Yazılım Lisanslarında Haftalık Fırsat!',
 'Windows, Office ve daha birçok yazılım lisansında özel indirim! Sepette kupon kodunu kullanarak ekstra tasarruf edin.',
 'https://images.unsplash.com/photo-1633419461186-7d40a38105ec?w=800&q=80',
 NULL, 'Yazılım kampanya görseli',
 'Ürünleri İncele', '/urunler',
 1, 0, 'weekly', 1,
 NULL, NULL,
 NULL, 'YAZILIM15', 'products', 70, 0,
 NOW(3), NOW(3)),

-- 4) YENİ: Sosyal medya takipçi paketi – anasayfa, daily
('d2e3f4a5-b6c7-8901-dcba-ef2345678901',
 'Sosyal Medyada Büyü – Takipçi Paketleri',
 'Instagram, TikTok, YouTube ve daha fazlası için uygun fiyatlı takipçi paketleri! Güvenli ve hızlı teslimat.',
 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&q=80',
 NULL, 'Sosyal medya takipçi kampanyası',
 'Paketleri Gör', '/urunler',
 1, 0, 'daily', 4,
 NULL, NULL,
 NULL, 'SOSYAL10', 'home', 60, 0,
 NOW(3), NOW(3)),

-- 5) YENİ: Oyun key kampanyası – ürün sayfaları, once
('e3f4a5b6-c7d8-9012-edcb-fa3456789012',
 'Oyun Keylerinde Büyük İndirim!',
 'Steam, Epic Games ve diğer platformlara ait oyun anahtarlarında sınırsız seçenek, uygun fiyat garantisi.',
 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&q=80',
 NULL, 'Oyun anahtar kampanyası',
 'Oyunlara Bak', '/urunler',
 1, 1, 'once', 2,
 NULL, NULL,
 NULL, 'OYUN20', 'products', 50, 0,
 NOW(3), NOW(3))

ON DUPLICATE KEY UPDATE
  `title`             = VALUES(`title`),
  `content`           = VALUES(`content`),
  `image_url`         = VALUES(`image_url`),
  `image_alt`         = VALUES(`image_alt`),
  `button_text`       = VALUES(`button_text`),
  `button_url`        = VALUES(`button_url`),
  `is_active`         = VALUES(`is_active`),
  `show_once`         = VALUES(`show_once`),
  `display_frequency` = VALUES(`display_frequency`),
  `delay`             = VALUES(`delay`),
  `valid_from`        = VALUES(`valid_from`),
  `valid_until`       = VALUES(`valid_until`),
  `coupon_code`       = VALUES(`coupon_code`),
  `display_pages`     = VALUES(`display_pages`),
  `priority`          = VALUES(`priority`),
  `duration_seconds`  = VALUES(`duration_seconds`),
  `updated_at`        = NOW(3);
