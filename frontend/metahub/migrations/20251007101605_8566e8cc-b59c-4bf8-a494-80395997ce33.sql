-- Update assign_stock_to_order function to also update products.stock_quantity
CREATE OR REPLACE FUNCTION public.assign_stock_to_order(p_order_item_id uuid, p_product_id uuid, p_quantity integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  -- Update products stock_quantity based on unused stock count
  UPDATE products
  SET stock_quantity = (
    SELECT COUNT(*)
    FROM product_stock
    WHERE product_id = p_product_id
      AND is_used = false
  )
  WHERE id = p_product_id;

  RETURN jsonb_build_object(
    'success', true,
    'assigned', v_assigned_count,
    'content', v_stock_items
  );
END;
$function$;