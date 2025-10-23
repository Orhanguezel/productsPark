SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS `user_roles` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `role` ENUM('admin','moderator','user') NOT NULL DEFAULT 'user',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `user_roles_user_id_idx` (`user_id`),
  KEY `user_roles_role_idx` (`role`),
  UNIQUE KEY `user_roles_user_id_role_unique` (`user_id`, `role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
