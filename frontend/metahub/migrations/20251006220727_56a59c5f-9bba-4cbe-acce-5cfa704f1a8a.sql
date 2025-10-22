-- Ek header ve footer kod alanları için site settings ekle
INSERT INTO public.site_settings (key, value)
VALUES
  ('custom_header_code', '""'::jsonb),
  ('custom_footer_code', '""'::jsonb)
ON CONFLICT DO NOTHING;