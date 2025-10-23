SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO `topbar_settings`
(`id`,`text`,`link`,`is_active`,`show_ticker`,`created_at`,`updated_at`) VALUES
('07bf8399-21fe-47fe-909d-9b6174bb4970','Üye Ol %10 İndirim Kazan','/giris',1,0,'2025-10-09 19:09:07.000','2025-10-09 19:09:07.000')
ON DUPLICATE KEY UPDATE
  `text` = VALUES(`text`),
  `link` = VALUES(`link`),
  `is_active` = VALUES(`is_active`),
  `show_ticker` = VALUES(`show_ticker`),
  `updated_at` = VALUES(`updated_at`);
