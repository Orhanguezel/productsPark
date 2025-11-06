-- =========================
-- TABLE: wallet_deposit_requests
-- =========================
CREATE TABLE IF NOT EXISTS `wallet_deposit_requests` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(50) NOT NULL,
  `payment_proof` varchar(500) DEFAULT NULL,
  `status` ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `admin_notes` text DEFAULT NULL,
  `processed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `wdr_user_idx` (`user_id`),
  KEY `wdr_created_idx` (`created_at`),
  KEY `wdr_status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- TABLE: wallet_transactions
-- =========================
CREATE TABLE IF NOT EXISTS `wallet_transactions` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `type` enum('deposit','withdrawal','purchase','refund') NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `order_id` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `wt_user_idx` (`user_id`),
  KEY `wt_created_idx` (`created_at`),
  KEY `wt_type_idx` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- SEED: wallet_deposit_requests
-- =========================
INSERT INTO `wallet_deposit_requests`
(`id`,`user_id`,`amount`,`payment_method`,`payment_proof`,`status`,`admin_notes`,`processed_at`,`created_at`,`updated_at`)
VALUES
('15cafe4b-4551-4041-98c3-fd2fdcb5bc1b','0ac37a5c-a8be-4d25-b853-1e5c9574c1b3',5000.00,'havale',NULL,'approved',NULL,NULL,'2025-10-07 09:49:16','2025-10-07 09:49:23'),
('1d2f9d83-6425-49a0-a859-5617bb2aa8c3','4a8fb7f7-0668-4429-9309-fe88ac90eed2',500.00,'havale',NULL,'pending',NULL,NULL,'2025-10-13 20:19:47','2025-10-13 20:19:47'),
('3051f1e8-174d-4753-92fd-e22387f76a3f','4a8fb7f7-0668-4429-9309-fe88ac90eed2',100.00,'havale',NULL,'pending',NULL,NULL,'2025-10-13 20:17:13','2025-10-13 20:17:13')
ON DUPLICATE KEY UPDATE
 `user_id`=VALUES(`user_id`),
 `amount`=VALUES(`amount`),
 `payment_method`=VALUES(`payment_method`),
 `payment_proof`=VALUES(`payment_proof`),
 `status`=VALUES(`status`),
 `admin_notes`=VALUES(`admin_notes`),
 `processed_at`=VALUES(`processed_at`),
 -- created_at sabit kalsın; sadece updated_at güncellenir
 `updated_at`=VALUES(`updated_at`);

-- =========================
-- SEED: wallet_transactions
-- =========================
INSERT INTO `wallet_transactions`
(`id`,`user_id`,`amount`,`type`,`description`,`order_id`,`created_at`)
VALUES
('0a0b3fd3-e78d-413e-bd7a-7645dceba60c','19a2bc26-63d1-43ad-ab56-d7f3c3719a34',10000.00,'deposit','Admin tarafından eklendi',NULL,'2025-10-13 15:53:40'),
('93ddd47b-bdcd-46f5-83cb-0af15dc4a60f','0ac37a5c-a8be-4d25-b853-1e5c9574c1b3',5000.00,'deposit','Bakiye yükleme onaylandı - havale',NULL,'2025-10-07 09:49:23')
ON DUPLICATE KEY UPDATE
 `user_id`=VALUES(`user_id`),
 `amount`=VALUES(`amount`),
 `type`=VALUES(`type`),
 `description`=VALUES(`description`),
 `order_id`=VALUES(`order_id`);
 -- created_at sabit
