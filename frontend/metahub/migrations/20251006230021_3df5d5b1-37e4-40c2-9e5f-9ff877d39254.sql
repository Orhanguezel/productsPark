-- Add is_featured column to categories table
ALTER TABLE public.categories
ADD COLUMN is_featured boolean DEFAULT false;

-- Add show_on_homepage column to products table
ALTER TABLE public.products
ADD COLUMN show_on_homepage boolean DEFAULT false;