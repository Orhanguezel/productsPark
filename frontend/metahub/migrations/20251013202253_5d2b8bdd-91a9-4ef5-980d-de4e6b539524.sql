-- Add new deposit request notification settings
INSERT INTO public.site_settings (key, value) 
VALUES 
  ('new_deposit_request_telegram', 'false'::jsonb),
  ('telegram_template_new_deposit_request', '{"template": "💰 *Yeni Bakiye Yükleme Talebi!*\n\n👤 Kullanıcı: {{user_name}}\n💵 Tutar: {{amount}} TL\n💳 Ödeme Yöntemi: {{payment_method}}\n\n⏰ Talep Tarihi: {{created_at}}"}'::jsonb)
ON CONFLICT (key) DO NOTHING;