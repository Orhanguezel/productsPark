-- 1. Make user_id nullable in orders table for guest orders
ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add icon column to menu_items for icon support
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS icon text;

-- 3. Add guest_order_enabled setting
INSERT INTO site_settings (key, value) 
VALUES ('guest_order_enabled', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 4. Update RLS policies for guest orders
DROP POLICY IF EXISTS "Guest users can create orders" ON orders;
CREATE POLICY "Guest users can create orders"
ON orders FOR INSERT
WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders"
ON orders FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- 5. Allow guest order items
DROP POLICY IF EXISTS "Users can insert order items for own orders" ON order_items;
CREATE POLICY "Users can insert order items for own orders"
ON order_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
  )
);

DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
CREATE POLICY "Users can view own order items"
ON order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND (orders.user_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  )
);