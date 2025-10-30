-- 89_payment_providers_seed.sql (final)

INSERT IGNORE INTO `payment_providers`
(`id`,`key`,`display_name`,`is_active`,`public_config`,`secret_config`,`created_at`,`updated_at`)
VALUES
(UUID(),'paytr',        'PayTR',        1, '{"mode":"test"}', '{"merchant_id":"xxx"}', NOW(3), NOW(3)),
(UUID(),'paytr_havale', 'PayTR Havale', 1, '{"mode":"test"}', NULL,                   NOW(3), NOW(3)),
(UUID(),'shopier',      'Shopier',      1, '{"mode":"test"}', NULL,                   NOW(3), NOW(3));
