-- Add article content fields to categories table
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS article_content text,
ADD COLUMN IF NOT EXISTS article_enabled boolean DEFAULT false;

-- Add article content fields to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS article_content text,
ADD COLUMN IF NOT EXISTS article_enabled boolean DEFAULT false;