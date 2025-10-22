-- Add custom_fields column to products table for product customization options
ALTER TABLE public.products
ADD COLUMN custom_fields jsonb DEFAULT '[]'::jsonb;