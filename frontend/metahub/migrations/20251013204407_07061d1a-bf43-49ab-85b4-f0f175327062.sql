-- Add coupon_id to orders table to track which coupon was used
ALTER TABLE orders ADD COLUMN coupon_id uuid REFERENCES coupons(id);