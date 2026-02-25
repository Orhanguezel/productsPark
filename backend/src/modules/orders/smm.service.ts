// ===================================================================
// FILE: src/modules/orders/smm.service.ts
// SMM Panel API helpers + order fulfillment orchestrator
// ===================================================================

import _fetch from 'node-fetch';
import { sql, eq, and, isNull } from 'drizzle-orm';
import { db } from '@/db/client';
import { order_items } from './schema';
import { products } from '@/modules/products/schema';
import { addTimeline } from './admin.controller';

const fetchAny: typeof fetch = (globalThis as any).fetch || (_fetch as any);

/* ------------------------------------------------------------------ */
/* Generic SMM API caller                                              */
/* ------------------------------------------------------------------ */

export async function callSmmApi(
  apiUrl: string,
  apiKey: string,
  params: Record<string, string>,
): Promise<any> {
  const body = new URLSearchParams({ key: apiKey, ...params }).toString();

  const res = await fetchAny(apiUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      accept: 'application/json, text/plain, */*',
      'user-agent': 'Mozilla/5.0 (compatible; ProductSpark/1.0)',
    },
    body,
  });

  const rawText = await res.text();

  let json: any;
  try {
    json = JSON.parse(rawText);
  } catch {
    throw new Error(`SMM API non-JSON response: ${rawText.slice(0, 200)}`);
  }

  if (json && typeof json === 'object' && json.error) {
    throw new Error(`SMM API error: ${String(json.error).slice(0, 200)}`);
  }

  return json;
}

/* ------------------------------------------------------------------ */
/* action=add — Place SMM order                                        */
/* ------------------------------------------------------------------ */

export async function smmPlaceOrder(
  apiUrl: string,
  apiKey: string,
  serviceId: string,
  link: string,
  quantity: number,
): Promise<{ orderId: string }> {
  const json = await callSmmApi(apiUrl, apiKey, {
    action: 'add',
    service: serviceId,
    link,
    quantity: String(quantity),
  });

  const orderId = json?.order != null ? String(json.order) : null;
  if (!orderId) {
    throw new Error(`SMM API add: no order id in response: ${JSON.stringify(json).slice(0, 200)}`);
  }

  return { orderId };
}

/* ------------------------------------------------------------------ */
/* action=status — Check SMM order status                              */
/* ------------------------------------------------------------------ */

export type SmmStatusResponse = {
  status: string;
  charge: string;
  start_count: string;
  remains: string;
  currency: string;
};

export async function smmCheckStatus(
  apiUrl: string,
  apiKey: string,
  smmOrderId: string,
): Promise<SmmStatusResponse> {
  const json = await callSmmApi(apiUrl, apiKey, {
    action: 'status',
    order: smmOrderId,
  });

  return {
    status: String(json?.status ?? ''),
    charge: String(json?.charge ?? ''),
    start_count: String(json?.start_count ?? ''),
    remains: String(json?.remains ?? ''),
    currency: String(json?.currency ?? ''),
  };
}

/* ------------------------------------------------------------------ */
/* action=services — List available SMM services                       */
/* ------------------------------------------------------------------ */

export async function smmListServices(
  apiUrl: string,
  apiKey: string,
): Promise<any[]> {
  const json = await callSmmApi(apiUrl, apiKey, { action: 'services' });
  return Array.isArray(json) ? json : [];
}

/* ------------------------------------------------------------------ */
/* Extract "link" from order item options + product custom_fields      */
/* ------------------------------------------------------------------ */

type CustomField = { id?: string; label?: string; type?: string };

function fieldKey(f: CustomField): string {
  return typeof f.id === 'string' && f.id.trim() ? f.id : (f.label ?? '');
}

export function extractLinkFromOptions(
  options: Record<string, string> | null | undefined,
  customFields: CustomField[] | null | undefined,
): string | null {
  if (!options || typeof options !== 'object') return null;

  const vals = Object.values(options).filter((v) => typeof v === 'string' && v.trim());
  if (!vals.length) return null;

  // 1) type='url' custom field value
  if (Array.isArray(customFields)) {
    for (const f of customFields) {
      if (f.type === 'url') {
        const key = fieldKey(f);
        const v = options[key];
        if (typeof v === 'string' && v.trim()) return v.trim();
      }
    }
  }

  // 2) first value that looks like a URL
  const urlVal = vals.find((v) => /^https?:\/\//i.test(v.trim()));
  if (urlVal) return urlVal.trim();

  // 3) first non-empty value
  return vals[0].trim();
}

/* ------------------------------------------------------------------ */
/* Load API provider credentials from DB                               */
/* ------------------------------------------------------------------ */

type ProviderCreds = { apiUrl: string; apiKey: string };

async function loadProviderCreds(providerId: string): Promise<ProviderCreds | null> {
  const rows: any = await db.execute(sql`
    SELECT credentials FROM api_providers
    WHERE id = ${providerId} AND is_active = 1
    LIMIT 1
  `);

  const data: any[] = Array.isArray(rows) ? rows : (rows?.rows ?? []);
  if (!data.length) return null;

  let creds: any;
  try {
    creds = typeof data[0].credentials === 'string'
      ? JSON.parse(data[0].credentials)
      : data[0].credentials;
  } catch {
    return null;
  }

  const apiUrl = typeof creds?.api_url === 'string' ? creds.api_url : '';
  const apiKey = typeof creds?.api_key === 'string' ? creds.api_key : '';
  if (!apiUrl || !apiKey) return null;

  return { apiUrl, apiKey };
}

/* ------------------------------------------------------------------ */
/* Main orchestrator — fulfillApiOrderItems                            */
/* ------------------------------------------------------------------ */

export async function fulfillApiOrderItems(
  orderId: string,
  logger?: { error?: (...args: any[]) => void; info?: (...args: any[]) => void },
): Promise<void> {
  // Load order items joined with products where delivery_type='api' and not yet fulfilled
  const rows = await db
    .select({
      itemId: order_items.id,
      itemOptions: order_items.options,
      apiOrderId: order_items.api_order_id,
      productId: products.id,
      productName: products.name,
      apiProviderId: products.api_provider_id,
      apiProductId: products.api_product_id,
      apiQuantity: products.api_quantity,
      deliveryType: products.delivery_type,
      customFields: products.custom_fields,
    })
    .from(order_items)
    .innerJoin(products, eq(products.id, order_items.product_id))
    .where(
      and(
        eq(order_items.order_id, orderId as any),
        eq(products.delivery_type as any, 'api'),
        isNull(order_items.api_order_id),
      ),
    );

  if (!rows.length) return;

  for (const row of rows) {
    try {
      const providerId = row.apiProviderId as string | null;
      const serviceId = row.apiProductId as string | null;
      const quantity = Number(row.apiQuantity ?? 1);

      if (!providerId || !serviceId) {
        logger?.error?.({ itemId: row.itemId }, 'smm_missing_provider_or_service');
        await markItemFailed(row.itemId as string);
        await addTimeline(orderId, 'api_delivery', `API teslimat başarısız: ${row.productName} — sağlayıcı veya servis ID eksik`);
        continue;
      }

      const creds = await loadProviderCreds(providerId);
      if (!creds) {
        logger?.error?.({ itemId: row.itemId, providerId }, 'smm_provider_not_found');
        await markItemFailed(row.itemId as string);
        await addTimeline(orderId, 'api_delivery', `API teslimat başarısız: ${row.productName} — sağlayıcı bulunamadı veya pasif`);
        continue;
      }

      // Parse options and custom_fields
      let options: Record<string, string> | null = null;
      try {
        options = typeof row.itemOptions === 'string' ? JSON.parse(row.itemOptions) : row.itemOptions as any;
      } catch { /* ignore */ }

      let customFields: CustomField[] | null = null;
      try {
        const cf = (row as any).customFields;
        customFields = typeof cf === 'string' ? JSON.parse(cf) : cf;
      } catch { /* ignore */ }

      const link = extractLinkFromOptions(options, customFields);
      if (!link) {
        logger?.error?.({ itemId: row.itemId }, 'smm_no_link_found');
        await markItemFailed(row.itemId as string);
        await addTimeline(orderId, 'api_delivery', `API teslimat başarısız: ${row.productName} — link/URL bulunamadı`);
        continue;
      }

      // Place SMM order
      const result = await smmPlaceOrder(creds.apiUrl, creds.apiKey, serviceId, link, quantity);

      // Update order item
      await db
        .update(order_items)
        .set({
          api_order_id: result.orderId as any,
          delivery_status: 'processing' as any,
          updated_at: sql`NOW(3)`,
        })
        .where(eq(order_items.id, row.itemId as any));

      await addTimeline(
        orderId,
        'api_delivery',
        `API sipariş gönderildi: ${row.productName} → SMM #${result.orderId}`,
      );

      logger?.info?.({ itemId: row.itemId, smmOrderId: result.orderId }, 'smm_order_placed');
    } catch (err: any) {
      logger?.error?.({ err, itemId: row.itemId }, 'smm_place_order_failed');
      await markItemFailed(row.itemId as string).catch(() => {});
      await addTimeline(
        orderId,
        'api_delivery',
        `API teslimat başarısız: ${row.productName} — ${String(err?.message ?? err).slice(0, 150)}`,
      ).catch(() => {});
    }
  }
}

async function markItemFailed(itemId: string) {
  await db
    .update(order_items)
    .set({
      delivery_status: 'failed' as any,
      updated_at: sql`NOW(3)`,
    })
    .where(eq(order_items.id, itemId as any));
}
