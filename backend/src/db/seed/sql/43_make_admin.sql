SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET collation_connection = utf8mb4_unicode_ci;

-- Bu dosya placeholder bazlıdır; runner {{...}} değerlerini enjekte eder.

-- USER: upsert
INSERT INTO users (
  id, email, password_hash, full_name, phone,
  wallet_balance, is_active, email_verified, created_at, updated_at
) VALUES (
  '{{ADMIN_ID}}',
  '{{ADMIN_EMAIL}}',
  '{{ADMIN_PASSWORD_HASH}}',
  'Orhan Güzel',
  '+905551112233',
  0.00, 1, 1,
  CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
)
ON DUPLICATE KEY UPDATE
  password_hash  = VALUES(password_hash),
  full_name      = VALUES(full_name),
  phone          = VALUES(phone),
  is_active      = 1,
  email_verified = 1,
  updated_at     = CURRENT_TIMESTAMP(3);

-- PROFILE: upsert
INSERT INTO profiles (id, full_name, phone, created_at, updated_at)
VALUES ('{{ADMIN_ID}}', 'Orhan Güzel', '+905551112233', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  phone     = VALUES(phone),
  updated_at= CURRENT_TIMESTAMP(3);

-- ROLE: admin rolü yoksa ekle
INSERT IGNORE INTO user_roles (id, user_id, role, created_at)
VALUES (UUID(), '{{ADMIN_ID}}', 'admin', CURRENT_TIMESTAMP(3));
