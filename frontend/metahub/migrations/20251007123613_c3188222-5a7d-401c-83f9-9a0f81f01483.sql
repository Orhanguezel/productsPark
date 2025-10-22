-- Add api_order_id column to order_items for tracking external API orders
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS api_order_id text;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_order_items_api_order_id 
ON public.order_items(api_order_id);

-- Add comment
COMMENT ON COLUMN public.order_items.api_order_id IS 'External API order ID (e.g., SMM panel order ID)';