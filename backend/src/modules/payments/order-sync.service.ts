// ===================================================================
// FILE: src/modules/payments/order-sync.service.ts
// Payment status -> Orders sync + fulfillment trigger
// ===================================================================

import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { orders } from '@/modules/orders/schema';

type LoggerLike = {
  info?: (...args: any[]) => void;
  warn?: (...args: any[]) => void;
  error?: (...args: any[]) => void;
};

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export async function syncOrderAfterPayment(args: {
  orderId: string | null | undefined;
  paymentStatus: 'paid' | 'failed';
  source: string;
  logger?: LoggerLike;
}) {
  const orderId = String(args.orderId ?? '').trim();
  if (!orderId || !isUuid(orderId)) {
    args.logger?.warn?.({ orderId: args.orderId, source: args.source }, 'payment_sync_skip_invalid_order_id');
    return;
  }

  const [ord] = await db
    .select({
      id: orders.id,
      status: orders.status,
      payment_status: orders.payment_status,
    })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!ord) {
    args.logger?.warn?.({ orderId, source: args.source }, 'payment_sync_order_not_found');
    return;
  }

  const patch: Record<string, unknown> = {
    payment_status: args.paymentStatus,
    updated_at: new Date() as any,
  };

  // Ödeme başarılıysa pending siparişi processing'e çek.
  if (args.paymentStatus === 'paid' && ord.status === 'pending') {
    patch.status = 'processing';
  }

  await db.update(orders).set(patch as any).where(eq(orders.id, orderId));

  if (args.paymentStatus !== 'paid') return;

  // Fire-and-forget fulfillment workers
  try {
    const { fulfillApiOrderItems } = await import('@/modules/orders/smm.service');
    fulfillApiOrderItems(orderId, args.logger).catch((err) => {
      args.logger?.error?.({ err, orderId, source: args.source }, 'smm_fulfillment_error');
    });
  } catch (err) {
    args.logger?.error?.({ err, orderId, source: args.source }, 'smm_fulfillment_import_failed');
  }

  try {
    const { fulfillTurkpinOrderItems } = await import('@/modules/orders/turkpin.service');
    fulfillTurkpinOrderItems(orderId, args.logger).catch((err) => {
      args.logger?.error?.({ err, orderId, source: args.source }, 'turkpin_fulfillment_error');
    });
  } catch (err) {
    args.logger?.error?.({ err, orderId, source: args.source }, 'turkpin_fulfillment_import_failed');
  }
}

