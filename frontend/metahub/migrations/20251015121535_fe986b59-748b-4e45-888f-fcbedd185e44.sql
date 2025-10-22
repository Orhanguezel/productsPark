-- Add display_order column to categories table
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Create index for better performance when fetching featured categories
CREATE INDEX IF NOT EXISTS idx_categories_display_order 
ON public.categories(display_order) 
WHERE is_featured = true;

-- Add comment for documentation
COMMENT ON COLUMN public.categories.display_order IS 'Display order for featured categories on homepage. Lower numbers appear first (1, 2, 3...). Default 0 appears last.';