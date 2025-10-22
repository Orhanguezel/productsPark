-- Kalan 4 hassas anahtarı RLS policy'ye ekle
DROP POLICY IF EXISTS "Public settings readable" ON site_settings;

CREATE POLICY "Public settings readable" ON site_settings
FOR SELECT USING (
  key NOT IN (
    -- SMTP Ayarları
    'smtp_host', 'smtp_port', 'smtp_username', 'smtp_password',
    'smtp_from_email', 'smtp_from_name', 'smtp_use_tls', 'smtp_use_ssl',
    
    -- PayTR Ayarları
    'paytr_merchant_id', 'paytr_merchant_key', 'paytr_merchant_salt',
    'paytr_test_mode', 'paytr_havale_merchant_id', 'paytr_havale_merchant_key', 
    'paytr_havale_merchant_salt', 'paytr_havale_test_mode',
    
    -- Shopier Ayarları
    'shopier_api_key', 'shopier_api_secret',
    'shopier_client_id', 'shopier_client_secret',
    
    -- Stripe Ayarları
    'stripe_secret_key',
    
    -- Papara Ayarları
    'papara_api_key',
    
    -- Telegram Ayarları
    'telegram_bot_token', 'telegram_chat_id',
    
    -- Analytics Ayarları
    'google_analytics_id', 'google_tag_manager_id'
  )
);