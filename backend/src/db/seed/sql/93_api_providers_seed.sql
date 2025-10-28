SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO `api_providers`
(`id`, `name`, `type`, `credentials`, `is_active`, `created_at`, `updated_at`)
VALUES
('5cc2d80a-d0bf-4333-b2c5-5aaebd3c7aa3',
 'Cekilisbayisi',
 'smm',
 '{\"api_url\":\"https://cekilisbayisi.com/api/v2\",\"api_key\":\"dd6a5d1ad1cda75ee74d34b238bf111c\",\"balance\":82.2550354,\"currency\":\"TRY\"}',
 1,
 '2025-10-07 12:46:38',
 '2025-10-09 09:42:19')
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `type` = VALUES(`type`),
  `credentials` = VALUES(`credentials`),
  `is_active` = VALUES(`is_active`),
  `updated_at` = VALUES(`updated_at`);
