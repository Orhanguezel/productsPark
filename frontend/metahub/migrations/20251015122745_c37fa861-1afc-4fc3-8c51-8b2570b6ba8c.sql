-- Add badges column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS badges jsonb DEFAULT '[]'::jsonb;