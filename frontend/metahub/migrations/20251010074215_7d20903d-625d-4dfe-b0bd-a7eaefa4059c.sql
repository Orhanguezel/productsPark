-- Tamamlanmış siparişlerin beklemedeki teslimatlarını güncelle
UPDATE order_items
SET delivery_status = 'delivered'
WHERE order_id IN (
  SELECT id 
  FROM orders 
  WHERE status = 'completed'
)
AND (delivery_status = 'pending' OR delivery_status IS NULL);