INSERT IGNORE INTO `payment_providers`
(`id`,`key`,`display_name`,`is_active`,`public_config`,`created_at`,`updated_at`)
VALUES
(UUID(), 'paytr',        'PayTR',        1, '{"mode":"test"}', NOW(3), NOW(3)),
(UUID(), 'paytr_havale', 'PayTR Havale', 1, '{"mode":"test"}', NOW(3), NOW(3)),
(UUID(), 'shopier',      'Shopier',      1, '{"mode":"test"}', NOW(3), NOW(3));
