-- Add badges column to categories table for category-specific badges
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS badges jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.categories.badges IS 'Category badges configuration with text and active status';

-- Example badge structure:
-- [
--   {"text": "Anında Teslimat", "active": true},
--   {"text": "7/24 Müşteri Desteği", "active": true},
--   {"text": "Orijinal Ürün Garantisi", "active": false},
--   {"text": "Kolay Aktivasyon", "active": true}
-- ]