INSERT IGNORE INTO `payment_providers`
(`id`,`key`,`display_name`,`is_active`,`public_config`,`secret_config`,`created_at`,`updated_at`)
VALUES
(
  UUID(),
  'paytr',
  'PayTR Kredi Kartı',
  1,
  '{"mode":"test","type":"card","commission":2.50,"test_mode":true}',
  '{"merchant_id":"xxx","merchant_key":"yyy","merchant_salt":"zzz"}',
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'paytr_havale',
  'PayTR Havale/EFT',
  1,
  '{"mode":"test","type":"bank_transfer","commission":0}',
  NULL,
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'shopier',
  'Shopier',
  0,
  '{"mode":"test","type":"card"}',
  NULL,
  NOW(3),
  NOW(3)
);
