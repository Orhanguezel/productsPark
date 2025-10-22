-- Add PayTR settings to site_settings
INSERT INTO site_settings (key, value) VALUES
  ('paytr_enabled', 'false'),
  ('paytr_merchant_id', '""'),
  ('paytr_merchant_key', '""'),
  ('paytr_merchant_salt', '""'),
  ('paytr_test_mode', 'true'),
  ('paytr_max_installment', '0'),
  ('paytr_no_installment', '0'),
  ('paytr_timeout_limit', '30'),
  ('paytr_currency', '"TL"')
ON CONFLICT (key) DO NOTHING;