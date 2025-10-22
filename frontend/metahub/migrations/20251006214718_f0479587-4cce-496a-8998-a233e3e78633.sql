-- Add homepage settings to site_settings table
INSERT INTO public.site_settings (key, value) VALUES
  ('home_display_mode', '"list"'::jsonb),
  ('home_header_top_text', '"İndirim Sezonu Başladı"'::jsonb),
  ('home_header_bottom_text', '"It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout."'::jsonb),
  ('home_header_sub_text_1', '"Yeni Üyelere Özel"'::jsonb),
  ('home_header_sub_text_2', '"%10 Fırsatı Dijimin''de!"'::jsonb),
  ('home_header_button_text', '"Ürünleri İncele"'::jsonb),
  ('home_header_show_contact', 'true'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;