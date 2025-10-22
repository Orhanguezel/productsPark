-- Create product type enum
CREATE TYPE public.product_type AS ENUM ('physical', 'software', 'theme', 'template', 'service', 'other');

-- Add demo-related columns to products table
ALTER TABLE public.products
ADD COLUMN product_type public.product_type DEFAULT 'other'::product_type NOT NULL,
ADD COLUMN demo_url text,
ADD COLUMN demo_embed_enabled boolean DEFAULT false,
ADD COLUMN demo_button_text text DEFAULT 'Demoyu İncele';

-- Update existing products to have appropriate default type
UPDATE public.products
SET product_type = 'other'::product_type
WHERE product_type IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.products.product_type IS 'Type of product: physical, software, theme, template, service, or other';
COMMENT ON COLUMN public.products.demo_url IS 'URL for product demo/preview';
COMMENT ON COLUMN public.products.demo_embed_enabled IS 'Whether to show demo in iframe on product page';
COMMENT ON COLUMN public.products.demo_button_text IS 'Customizable text for demo button';