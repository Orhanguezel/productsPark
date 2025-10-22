-- Remove unique constraint on user_id,product_id to allow multiple cart items for API products with different custom_fields
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_user_id_product_id_key;

-- Create a new index for faster lookups (non-unique)
CREATE INDEX IF NOT EXISTS idx_cart_items_user_product ON cart_items(user_id, product_id);