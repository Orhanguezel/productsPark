-- 044_faqs.sql
DROP TABLE IF EXISTS `faqs`;
CREATE TABLE `faqs` (
  `id`            CHAR(36)     NOT NULL,
  `question`      VARCHAR(500) NOT NULL,
  `answer`        LONGTEXT     NOT NULL,
  `slug`          VARCHAR(255) NOT NULL,
  `category`      VARCHAR(255) DEFAULT NULL,
  `is_active`     TINYINT(1)   NOT NULL DEFAULT 1,
  `display_order` INT          NOT NULL DEFAULT 0,
  `created_at`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_faqs_slug` (`slug`),
  KEY `faqs_active_idx`(`is_active`),
  KEY `faqs_order_idx`(`display_order`),
  KEY `faqs_created_idx`(`created_at`),
  KEY `faqs_updated_idx`(`updated_at`),
  KEY `faqs_category_idx`(`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `faqs`
(`id`,`question`,`answer`,`slug`,`category`,`is_active`,`display_order`,`created_at`,`updated_at`)
VALUES
-- 1) Teslimat
(UUID(),
 'Ürünler ne kadar sürede teslim edilir?',
 'Ödemeniz onaylandıktan sonra ürününüz otomatik olarak anında e-posta adresinize ve üye panelinize teslim edilir. Ortalama teslimat süresi 1-2 dakikadır.',
 'urunler-ne-kadar-surede-teslim-edilir','Teslimat',1,1,'2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

-- 2) Ödeme yöntemleri
(UUID(),
 'Hangi ödeme yöntemlerini kabul ediyorsunuz?',
 'Kredi kartı, banka havalesi, Papara, PayTR, Shopier ve kripto para (Coinbase Commerce) ile ödeme yapabilirsiniz. Tüm ödemeler SSL sertifikası ile güvence altındadır.',
 'hangi-odeme-yontemlerini-kabul-ediyorsunuz','Ödeme',1,2,'2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

-- 3) Ürün çalışmazsa / iade & garanti
(UUID(),
 'Ürün çalışmazsa ne olur?',
 'Satın aldığınız ürün çalışmaz veya hatalı ise 7 gün içinde destek ekibimizle iletişime geçerek değişim veya iade talebinde bulunabilirsiniz. Tüm ürünlerimiz garanti kapsamındadır.',
 'urun-calismazsa-ne-olur','İade & Garanti',1,3,'2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

-- 4) Toplu alım / indirim
(UUID(),
 'Toplu alımlarda indirim var mı?',
 'Evet! 5+ ürün alımlarında %5, 10+ ürün alımlarında %10 indirim otomatik olarak uygulanır. Daha fazla bilgi için müşteri hizmetlerimizle iletişime geçebilirsiniz.',
 'toplu-alimlarda-indirim-var-mi','İndirim & Kampanya',1,4,'2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

-- 5) Lisans kullanımı
(UUID(),
 'Lisanslar kaç cihazda kullanılabilir?',
 'Her ürünün kullanım koşulları farklıdır. Ürün detay sayfasında lisans türü ve kaç cihazda kullanılabileceği belirtilmiştir. Tek kullanımlık, çoklu kullanım ve süreli lisanslar mevcuttur.',
 'lisanslar-kac-cihazda-kullanilabilir','Lisans',1,5,'2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

-- 6) Destek kanalları
(UUID(),
 'Müşteri desteği nasıl alırım?',
 '7/24 canlı destek, e-posta, WhatsApp ve Telegram üzerinden bizimle iletişime geçebilirsiniz. Üye panelinizden destek talebi oluşturabilir veya SSS bölümünü inceleyebilirsiniz.',
 'musteri-destegi-nasil-alirim','Destek',1,6,'2024-01-01 00:00:00.000','2024-01-01 00:00:00.000')
ON DUPLICATE KEY UPDATE
 `question`=VALUES(`question`),
 `answer`=VALUES(`answer`),
 `category`=VALUES(`category`),
 `is_active`=VALUES(`is_active`),
 `display_order`=VALUES(`display_order`),
 `updated_at`=VALUES(`updated_at`);
