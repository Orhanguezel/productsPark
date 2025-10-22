-- Add new columns to coupons table for category and product specific coupons
ALTER TABLE public.coupons 
ADD COLUMN applicable_to text NOT NULL DEFAULT 'all',
ADD COLUMN category_ids uuid[] DEFAULT NULL,
ADD COLUMN product_ids uuid[] DEFAULT NULL;

-- Add check constraint to ensure applicable_to has valid values
ALTER TABLE public.coupons 
ADD CONSTRAINT coupons_applicable_to_check 
CHECK (applicable_to IN ('all', 'category', 'product'));

-- Add comment for documentation
COMMENT ON COLUMN public.coupons.applicable_to IS 'Defines where the coupon can be applied: all (site-wide), category (specific categories), product (specific products)';
COMMENT ON COLUMN public.coupons.category_ids IS 'Array of category UUIDs if applicable_to is category';
COMMENT ON COLUMN public.coupons.product_ids IS 'Array of product UUIDs if applicable_to is product';