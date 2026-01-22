-- =============================================================
-- FILE: 60.3_site_settings_telegram.seed.sql
-- FINAL — Telegram settings + templates
-- - Upsert by unique key (site_settings.key)
-- - Includes: ticket_replied_telegram + telegram_template_ticket_replied
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO `site_settings` (`id`, `key`, `value`, `created_at`, `updated_at`) VALUES
-- ------------------------------------------------------------------
-- TELEGRAM / BOT + ROUTING
-- ------------------------------------------------------------------
('a7f3c2d1-1c0a-4f1d-9f6b-1b1c1d1e1f10', 'telegram_notifications_enabled', 'true', NOW(3), NOW(3)),
('b1c2d3e4-2f3a-4b5c-8d6e-7f8090a1b2c3', 'telegram_webhook_enabled',       'true', NOW(3), NOW(3)),

('c2d3e4f5-3a4b-5c6d-7e8f-9012a3b4c5d6', 'telegram_chat_id',              '7474884105', NOW(3), NOW(3)),
('d3e4f506-4b5c-6d7e-8f90-12a3b4c5d6e7', 'telegram_default_chat_id',      '7474884105', NOW(3), NOW(3)),

('e4f50617-5c6d-7e8f-9012-a3b4c5d6e7f8', 'telegram_bot_token',            '{{TELEGRAM_BOT_TOKEN}}', NOW(3), NOW(3)),

-- ------------------------------------------------------------------
-- TELEGRAM / EVENT FLAGS
-- ------------------------------------------------------------------
('f5061728-6d7e-8f90-12a3-b4c5d6e7f809', 'deposit_approved_telegram',      'true',  NOW(3), NOW(3)),
('1728394a-8f90-12a3-b4c5-d6e7f8091a2b', 'new_deposit_request_telegram',   'false', NOW(3), NOW(3)),
('28394a5b-9012-a3b4-c5d6-e7f8091a2b3c', 'new_payment_request_telegram',   'true',  NOW(3), NOW(3)),
('394a5b6c-12a3-b4c5-d6e7-f8091a2b3c4d', 'new_order_telegram',             'true',  NOW(3), NOW(3)),
('4a5b6c7d-a3b4-c5d6-e7f8-091a2b3c4d5e', 'new_ticket_telegram',            'true',  NOW(3), NOW(3)),
('6aa1b0c1-1111-4aaa-8bbb-222233334444', 'ticket_replied_telegram',        'true',  NOW(3), NOW(3)),

-- ------------------------------------------------------------------
-- TELEGRAM / TEMPLATES
-- ------------------------------------------------------------------
('5b6c7d8e-b4c5-d6e7-f809-1a2b3c4d5e6f', 'telegram_template_deposit_approved',
'💰 *Bakiye Yükleme Onaylandı!*\n\n👤 Kullanıcı: {{user_name}}\n💵 Tutar: {{amount}} TL\n\n⏰ Onay Tarihi: {{created_at}}',
NOW(3), NOW(3)),

('6c7d8e9f-c5d6-e7f8-091a-2b3c4d5e6f70', 'telegram_template_new_deposit_request',
'💰 *Yeni Bakiye Yükleme Talebi!*\n\n👤 Kullanıcı: {{user_name}}\n💵 Tutar: {{amount}} TL\n💳 Ödeme Yöntemi: {{payment_method}}\n\n⏰ Talep Tarihi: {{created_at}}',
NOW(3), NOW(3)),

('8e9f0123-e7f8-091a-2b3c-4d5e6f708192', 'telegram_template_new_payment_request',
'💳 *Yeni Ödeme Talebi!*\n\n📋 Sipariş No: {{order_number}}\n👤 Müşteri: {{customer_name}}\n📧 Email: {{customer_email}}\n{{customer_phone}}\n\n💰 Tutar: {{amount}} TL\n💳 Ödeme Yöntemi: {{payment_method}}\n\n📦 Ürünler:\n{{order_items}}\n\n⏰ Talep Tarihi: {{created_at}}',
NOW(3), NOW(3)),

('7d8e9f01-d6e7-f809-1a2b-3c4d5e6f7081', 'telegram_template_new_order',
'🛒 *Yeni Sipariş Alındı!*\n\n📋 Sipariş No: {{order_number}}\n👤 Müşteri: {{customer_name}}\n📧 Email: {{customer_email}}\n{{customer_phone}}\n\n💰 Toplam Tutar: {{final_amount}} TL\n{{discount}}\n\n📦 Ürünler:\n{{order_items}}\n\n⏰ Sipariş Tarihi: {{created_at}}',
NOW(3), NOW(3)),

('9f012345-f809-1a2b-3c4d-5e6f708192a3', 'telegram_template_new_ticket',
'🎫 *Yeni Destek Talebi Açıldı!*\n\n👤 Kullanıcı: {{user_name}}\n📋 Konu: {{subject}}\n📊 Öncelik: {{priority}}\n{{category}}\n\n💬 Mesaj:\n{{message}}\n\n⏰ Talep Tarihi: {{created_at}}',
NOW(3), NOW(3)),

('7bb2c1d2-3333-4bbb-8ccc-444455556666', 'telegram_template_ticket_replied',
'💬 *Destek Talebinize Yanıt Geldi*\n\n👤 Kullanıcı: {{user_name}}\n📋 Konu: {{subject}}\n📊 Öncelik: {{priority}}\n\n✉️ Yanıt:\n{{message}}\n\n⏰ Tarih: {{created_at}}',
NOW(3), NOW(3))

ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);
