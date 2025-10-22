-- Add currency support settings
-- This will store currency exchange rates and default currency

-- Insert default currencies with exchange rates (TRY as base currency)
INSERT INTO public.site_settings (key, value) VALUES
  ('default_currency', '"TRY"'::jsonb),
  ('available_currencies', '["TRY", "USD", "EUR"]'::jsonb),
  ('currency_rates', '{"TRY": 1, "USD": 0.031, "EUR": 0.029}'::jsonb),
  ('auto_update_rates', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;