-- =============================================================
-- FILE: 181_newsletter_subscribers_seed.sql
-- FINAL — Newsletter subscribers seed (Single Language)
-- - locale removed
-- - Idempotent: requires UNIQUE(email)
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

START TRANSACTION;

INSERT INTO `newsletter_subscribers`
(`id`, `email`, `is_verified`, `meta`, `unsubscribed_at`, `created_at`, `updated_at`)
VALUES

-- 1) Active, verified subscriber (demo)
(
  UUID(),
  'demo.user1@example.com',
  1,
  JSON_OBJECT(
    'source', 'seed',
    'tags', JSON_ARRAY('campaign', 'welcome'),
    'note', 'Örnek: doğrulanmış abone'
  ),
  NULL,
  '2025-01-05 10:00:00.000',
  '2025-01-05 10:00:00.000'
),

-- 2) Active, not verified subscriber (demo)
(
  UUID(),
  'demo.user2@example.com',
  0,
  JSON_OBJECT(
    'source', 'seed',
    'tags', JSON_ARRAY('newsletter'),
    'note', 'Verification pending'
  ),
  NULL,
  '2025-01-06 11:30:00.000',
  '2025-01-06 11:30:00.000'
),

-- 3) Former subscriber (unsubscribed) (demo)
(
  UUID(),
  'demo.user3@example.com',
  1,
  JSON_OBJECT(
    'source', 'seed',
    'tags', JSON_ARRAY('unsubscribed'),
    'note', 'Abonelik iptal edilmiş örnek kayıt'
  ),
  '2025-01-10 15:45:00.000',
  '2025-01-03 09:00:00.000',
  '2025-01-10 15:45:00.000'
)

ON DUPLICATE KEY UPDATE
  `is_verified`     = VALUES(`is_verified`),
  `meta`            = VALUES(`meta`),
  `unsubscribed_at` = VALUES(`unsubscribed_at`),
  `updated_at`      = CURRENT_TIMESTAMP(3);

COMMIT;
