-- Add balance and currency columns to api_providers table
ALTER TABLE public.api_providers 
ADD COLUMN IF NOT EXISTS balance numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS last_balance_check timestamp with time zone;

-- Add comment
COMMENT ON COLUMN public.api_providers.balance IS 'Current balance from the API provider';
COMMENT ON COLUMN public.api_providers.currency IS 'Currency of the balance';
COMMENT ON COLUMN public.api_providers.last_balance_check IS 'Last time balance was checked';