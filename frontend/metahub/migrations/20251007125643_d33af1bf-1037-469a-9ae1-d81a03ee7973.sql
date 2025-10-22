-- Add api_quantity column to products table for SMM API integration
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS api_quantity integer DEFAULT 1;

-- Add comment
COMMENT ON COLUMN public.products.api_quantity IS 'Quantity to send to SMM API (fixed amount per order)';