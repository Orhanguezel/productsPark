-- Update api_providers table to allow 'smm' as a valid provider_type
-- First, drop the existing check constraint if it exists
ALTER TABLE public.api_providers 
DROP CONSTRAINT IF EXISTS api_providers_provider_type_check;

-- Add a new check constraint that allows 'smm' as a valid provider type
ALTER TABLE public.api_providers 
ADD CONSTRAINT api_providers_provider_type_check 
CHECK (provider_type IN ('smm'));