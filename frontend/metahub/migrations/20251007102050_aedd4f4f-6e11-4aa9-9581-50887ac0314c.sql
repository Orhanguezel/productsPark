-- Fix products UPDATE policy by adding WITH CHECK
DROP POLICY IF EXISTS "Admins can update products" ON products;

CREATE POLICY "Admins can update products" 
ON products 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));