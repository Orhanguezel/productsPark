-- Remove the old check constraint
ALTER TABLE order_items 
DROP CONSTRAINT IF EXISTS order_items_delivery_status_check;

-- Add new constraint with correct values
ALTER TABLE order_items
ADD CONSTRAINT order_items_delivery_status_check 
CHECK (delivery_status IN ('pending', 'processing', 'delivered', 'failed'));