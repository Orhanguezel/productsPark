-- POPUPS SEED
SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT IGNORE INTO `popups`
(`id`, `title`, `content`, `image_url`, `button_text`, `button_url`,
 `is_active`, `show_once`, `delay`, `valid_from`, `valid_until`, `created_at`, `updated_at`)
VALUES
('b57879a1-bdb0-4ccd-90a6-fae11d42850b',
 'Üye Ol İlk Siparişinde %10 İndirim Kap',
 'Sitemize üye olarak yapacağınız ilk siparişlerde geçerli indirim kodunuz hazır.',
 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/blog-images/popup-images/gagx81xi1uh-1760559551779.png',
 'Alışveriş Yap',
 NULL,
 1,  /* is_active */
 0,  /* show_once  -> FE tarafında display_frequency = "always" */
 3,  /* delay (saniye) -> FE'de delay_seconds */
 NULL,
 NULL,
 '2025-10-09 18:54:42.000',
 '2025-10-15 20:19:18.000');
