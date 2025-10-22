-- Extend api_providers table for Turkpin Epin/TopUp/Membership
ALTER TYPE public.product_type ADD VALUE IF NOT EXISTS 'epin';
ALTER TYPE public.product_type ADD VALUE IF NOT EXISTS 'topup';

-- Add new columns to api_providers
ALTER TABLE public.api_providers
ADD COLUMN IF NOT EXISTS webhook_url text,
ADD COLUMN IF NOT EXISTS webhook_secret text,
ADD COLUMN IF NOT EXISTS endpoints jsonb DEFAULT '{}'::jsonb;

-- Add new columns to products for Epin/TopUp integration
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS epin_game_id text,
ADD COLUMN IF NOT EXISTS epin_product_id text,
ADD COLUMN IF NOT EXISTS auto_delivery_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS min_order integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_order integer,
ADD COLUMN IF NOT EXISTS min_barem numeric,
ADD COLUMN IF NOT EXISTS max_barem numeric,
ADD COLUMN IF NOT EXISTS barem_step numeric,
ADD COLUMN IF NOT EXISTS pre_order_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS tax_type integer DEFAULT 0;

-- Add new columns to order_items for API logging
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS api_response_log jsonb,
ADD COLUMN IF NOT EXISTS delivery_error_details jsonb,
ADD COLUMN IF NOT EXISTS turkpin_order_no text;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_order_items_turkpin_order_no ON public.order_items(turkpin_order_no);
CREATE INDEX IF NOT EXISTS idx_order_items_delivery_status ON public.order_items(delivery_status);
CREATE INDEX IF NOT EXISTS idx_products_epin_game_id ON public.products(epin_game_id);
CREATE INDEX IF NOT EXISTS idx_products_epin_product_id ON public.products(epin_product_id);