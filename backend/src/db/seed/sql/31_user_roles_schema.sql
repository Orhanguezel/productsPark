-- --------------------------------------------------------
-- 31 - User Roles Schema
-- Table structure for table `user_roles`
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET collation_connection = utf8mb4_unicode_ci;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS `user_roles` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `role` ENUM('admin','moderator','user') NOT NULL DEFAULT 'user',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `user_roles_user_id_idx` (`user_id`),
  KEY `user_roles_role_idx` (`role`),
  UNIQUE KEY `user_roles_user_id_role_unique` (`user_id`, `role`),
  CONSTRAINT `fk_user_roles_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
