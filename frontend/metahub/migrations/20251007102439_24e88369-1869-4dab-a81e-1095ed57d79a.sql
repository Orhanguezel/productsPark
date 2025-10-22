-- Fix SELECT policy to allow admins to see all products
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;

CREATE POLICY "Products are viewable by everyone" 
ON products 
FOR SELECT 
USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));