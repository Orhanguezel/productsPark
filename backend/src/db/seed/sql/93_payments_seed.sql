INSERT IGNORE INTO `payments`
(`id`,`order_id`,`provider`,`currency`,`amount_authorized`,`amount_captured`,`amount_refunded`,`fee_amount`,`status`,`reference`,`transaction_id`,`is_test`,`metadata`,`created_at`,`updated_at`)
VALUES
(UUID(), NULL, 'paytr', 'TRY', 100.00, '0.00', '0.00', NULL, 'authorized', NULL, NULL, 1, NULL, NOW(3), NOW(3));
