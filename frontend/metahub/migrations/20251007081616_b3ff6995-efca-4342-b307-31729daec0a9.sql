-- Add parent_id column to categories table for subcategories
ALTER TABLE public.categories
ADD COLUMN parent_id uuid REFERENCES public.categories(id) ON DELETE CASCADE;

-- Add index for better performance
CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);

-- Add a comment to explain the structure
COMMENT ON COLUMN public.categories.parent_id IS 'References parent category for subcategory support. NULL means top-level category.';