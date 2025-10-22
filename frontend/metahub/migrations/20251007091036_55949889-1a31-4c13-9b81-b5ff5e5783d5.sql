-- Add payment method settings to site_settings if not exists
INSERT INTO public.site_settings (key, value)
VALUES (
  'payment_methods',
  jsonb_build_object(
    'wallet_enabled', true,
    'havale_enabled', false,
    'havale_iban', '',
    'havale_account_holder', '',
    'havale_bank_name', '',
    'eft_enabled', false,
    'eft_iban', '',
    'eft_account_holder', '',
    'eft_bank_name', ''
  )
)
ON CONFLICT (key) DO NOTHING;