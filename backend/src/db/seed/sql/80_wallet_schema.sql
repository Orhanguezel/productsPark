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
  `processed_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `wdr_user_idx` (`user_id`),
  KEY `wdr_created_idx` (`created_at`),
  KEY `wdr_status_idx` (`status`),
  KEY `wdr_user_status_idx` (`user_id`, `status`)
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

  -- ✅ Only for deposit: link to deposit request (idempotency)
  `deposit_request_id` char(36) DEFAULT NULL,

  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `wt_user_idx` (`user_id`),
  KEY `wt_created_idx` (`created_at`),
  KEY `wt_type_idx` (`type`),
  KEY `wt_order_idx` (`order_id`),
  KEY `wt_user_created_idx` (`user_id`, `created_at`),

  -- ✅ One ledger credit per deposit request (enforces idempotency)
  UNIQUE KEY `wt_unique_deposit_request` (`deposit_request_id`),

  CONSTRAINT `wt_amount_nonzero_chk` CHECK (`amount` <> 0),
  CONSTRAINT `wt_amount_sign_chk` CHECK (
    (`type` IN ('deposit','refund') AND `amount` > 0)
    OR
    (`type` IN ('withdrawal','purchase') AND `amount` < 0)
  ),

  CONSTRAINT `wt_deposit_req_only_for_deposit_chk` CHECK (
    (`deposit_request_id` IS NULL)
    OR
    (`type` = 'deposit' AND `deposit_request_id` IS NOT NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
