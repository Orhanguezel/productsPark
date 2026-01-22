SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS `api_providers` (
  `id` char(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `type` varchar(50) NOT NULL,
  `credentials` longtext
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_bin
    NOT NULL
    CHECK (json_valid(`credentials`)),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `api_providers_active_idx` (`is_active`),
  KEY `api_providers_type_idx` (`type`),
  KEY `api_providers_name_idx` (`name`)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
