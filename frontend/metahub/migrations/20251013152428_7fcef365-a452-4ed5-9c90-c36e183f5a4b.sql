-- Add Telegram notification toggle settings
INSERT INTO site_settings (key, value) VALUES
  ('new_order_telegram', 'true'::jsonb),
  ('new_ticket_telegram', 'true'::jsonb),
  ('deposit_telegram', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;