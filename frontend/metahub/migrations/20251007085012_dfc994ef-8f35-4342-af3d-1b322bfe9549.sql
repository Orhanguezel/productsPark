-- Add delivery system columns to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS delivery_type text DEFAULT 'manual' CHECK (delivery_type IN ('manual', 'auto_stock', 'file', 'api')),
ADD COLUMN IF NOT EXISTS stock_list text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS file_url text,
ADD COLUMN IF NOT EXISTS api_provider_id uuid,
ADD COLUMN IF NOT EXISTS api_product_id text;

-- Create API providers table
CREATE TABLE IF NOT EXISTS api_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  api_url text NOT NULL,
  api_key text NOT NULL,
  is_active boolean DEFAULT true,
  provider_type text NOT NULL CHECK (provider_type IN ('epin', 'game_key', 'custom')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on api_providers
ALTER TABLE api_providers ENABLE ROW LEVEL SECURITY;

-- API providers policies
CREATE POLICY "Admins can manage API providers"
ON api_providers FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add delivery columns to order_items
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS delivery_content text,
ADD COLUMN IF NOT EXISTS delivery_status text DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'delivered', 'failed')),
ADD COLUMN IF NOT EXISTS downloaded_at timestamptz,
ADD COLUMN IF NOT EXISTS delivery_error text;

-- Create product_stock table to track used stock items
CREATE TABLE IF NOT EXISTS product_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  stock_content text NOT NULL,
  is_used boolean DEFAULT false,
  used_at timestamptz,
  order_item_id uuid REFERENCES order_items(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on product_stock
ALTER TABLE product_stock ENABLE ROW LEVEL SECURITY;

-- Product stock policies
CREATE POLICY "Admins can manage product stock"
ON product_stock FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update trigger for api_providers
CREATE TRIGGER update_api_providers_updated_at
  BEFORE UPDATE ON api_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-assign stock to order
CREATE OR REPLACE FUNCTION assign_stock_to_order(p_order_item_id uuid, p_product_id uuid, p_quantity integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stock_items text[];
  v_stock_record RECORD;
  v_assigned_count integer := 0;
BEGIN
  -- Get available stock items
  FOR v_stock_record IN
    SELECT id, stock_content
    FROM product_stock
    WHERE product_id = p_product_id
      AND is_used = false
    ORDER BY created_at
    LIMIT p_quantity
    FOR UPDATE SKIP LOCKED
  LOOP
    -- Mark as used
    UPDATE product_stock
    SET is_used = true,
        used_at = now(),
        order_item_id = p_order_item_id
    WHERE id = v_stock_record.id;
    
    v_stock_items := array_append(v_stock_items, v_stock_record.stock_content);
    v_assigned_count := v_assigned_count + 1;
  END LOOP;

  IF v_assigned_count < p_quantity THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient stock',
      'assigned', v_assigned_count,
      'requested', p_quantity
    );
  END IF;

  -- Update order item with delivery content
  UPDATE order_items
  SET delivery_content = array_to_string(v_stock_items, E'\n'),
      delivery_status = 'delivered'
  WHERE id = p_order_item_id;

  RETURN jsonb_build_object(
    'success', true,
    'assigned', v_assigned_count,
    'content', v_stock_items
  );
END;
$$;