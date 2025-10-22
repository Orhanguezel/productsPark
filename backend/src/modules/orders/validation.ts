import { z } from 'zod';

export const paymentMethods = [
  'credit_card',
  'bank_transfer',
  'wallet',
  'paytr',
  'shopier',
] as const;

export const orderStatuses = [
  'pending',
  'processing',
  'completed',
  'cancelled',
  'refunded',
] as const;

export const deliveryStatuses = [
  'pending',
  'processing',
  'delivered',
  'failed',
] as const;

const dec2 = z.union([
  z.string().regex(/^-?\d+(\.\d{1,2})?$/),
  z.number().finite(),
]).transform(v => (typeof v === 'number' ? v.toFixed(2) : v));

// ---- createOrder
export const orderItemCreateSchema = z.object({
  product_id: z.string().uuid(),
  product_name: z.string().min(1),
  quantity: z.coerce.number().int().min(1),
  price: dec2,
  total: dec2.optional(),
  options: z.any().optional().nullable(),
});

export const orderCreateSchema = z.object({
  order_number: z.string().max(50).optional(),
  payment_method: z.enum(paymentMethods),
  payment_status: z.string().max(50).default('pending').optional(),
  coupon_code: z.string().max(50).optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(orderItemCreateSchema).min(1),

  subtotal: dec2.optional(),
  discount: dec2.optional().default('0.00'),
  total: dec2.optional(),
});

// ---- updateOrder / updateOrderItem
export const orderUpdateSchema = z.object({
  status: z.enum(orderStatuses).optional(),
  payment_status: z.string().max(50).optional(),
  payment_provider: z.string().max(50).optional().nullable(),
  payment_id: z.string().max(255).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const orderItemUpdateSchema = z.object({
  delivery_status: z.enum(deliveryStatuses).optional(),
  activation_code: z.string().optional().nullable(),
  stock_code: z.string().optional().nullable(),
  api_order_id: z.string().optional().nullable(),
  delivered_at: z.coerce.date().optional().nullable(),
  options: z.any().optional().nullable(),
});

// ---- checkout (cart → order)
const pricingItemSchema = z.object({
  product_id: z.string().uuid(),
  product_name: z.string().min(1),
  price: dec2,
});

export const checkoutFromCartSchema = z.object({
  cart_item_ids: z.array(z.string().uuid()).optional(), // yoksa tüm sepet
  pricing: z.array(pricingItemSchema).optional(),       // ürün tablon yoksa zorunlu
  order_number: z.string().max(50).optional(),
  payment_method: z.enum(paymentMethods),
  payment_status: z.string().max(50).default('pending').optional(),
  coupon_code: z.string().max(50).optional().nullable(),
  notes: z.string().optional().nullable(),
  subtotal: dec2.optional(),
  discount: dec2.optional().default('0.00'),
  total: dec2.optional(),
});

export type CheckoutFromCartInput = z.infer<typeof checkoutFromCartSchema>;
