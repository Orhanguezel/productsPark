// ===================================================================
// FILE: src/modules/orders/turkpin.service.ts
// Turkpin API helpers + order fulfillment orchestrator
// ===================================================================

import _fetch from 'node-fetch';
import { and, eq, isNull, or, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { order_items } from './schema';
import { products } from '@/modules/products/schema';
import { addTimeline } from './admin.controller';

const fetchAny: typeof fetch = (globalThis as any).fetch || (_fetch as any);

type ProviderCreds = {
  apiUrl: string;
  apiKey: string;
  providerType: string;
  rawCreds: Record<string, unknown>;
};

type TurkpinCallResult = {
  action: string;
  rawText: string;
  rawJson: unknown;
};

function parseJsonSafe<T = unknown>(v: unknown): T | null {
  if (v == null) return null;
  if (typeof v !== 'string') return v as T;
  try {
    return JSON.parse(v) as T;
  } catch {
    return null;
  }
}

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function toStr(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === 'string') {
    const s = v.trim();
    return s.length ? s : null;
  }
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return null;
}

function toNum(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v.replace(',', '.').trim());
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function splitUserPass(apiKey: string): { username: string; password: string } {
  const raw = apiKey.trim();
  if (!raw) return { username: '', password: '' };
  const idx = raw.indexOf(':');
  if (idx < 0) return { username: raw, password: '' };
  return {
    username: raw.slice(0, idx).trim(),
    password: raw.slice(idx + 1).trim(),
  };
}

async function loadProviderCreds(providerId: string): Promise<ProviderCreds | null> {
  const rows: any = await db.execute(sql`
    SELECT \`type\`, credentials
    FROM api_providers
    WHERE id = ${providerId} AND is_active = 1
    LIMIT 1
  `);

  const data: any[] = Array.isArray(rows) ? rows : (rows?.rows ?? []);
  if (!data.length) return null;

  const credsRaw = parseJsonSafe<Record<string, unknown>>(data[0].credentials) ?? {};
  const apiUrl = toStr((credsRaw as any).api_url) ?? toStr((credsRaw as any).apiUrl) ?? '';
  const apiKey = toStr((credsRaw as any).api_key) ?? toStr((credsRaw as any).apiKey) ?? '';
  const providerType = toStr(data[0].type) ?? '';

  if (!apiUrl || !apiKey) return null;
  return { apiUrl, apiKey, providerType, rawCreds: credsRaw };
}

async function postTurkpin(
  apiUrl: string,
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; rawText: string; rawJson: unknown }> {
  const body = new URLSearchParams(
    Object.entries(payload).map(([k, v]) => [k, v == null ? '' : String(v)]),
  ).toString();

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
  let rawJson: unknown = rawText;
  try {
    rawJson = JSON.parse(rawText);
  } catch {
    // text response
  }

  return { ok: res.ok, rawText, rawJson };
}

function providerError(v: unknown): string | null {
  if (!isObj(v)) return null;
  const explicit = toStr(v.error) ?? toStr((v as any).err) ?? toStr((v as any).error_message);
  if (explicit) return explicit;

  const status = (toStr((v as any).status) ?? toStr((v as any).success) ?? '').toLowerCase();
  if (['false', '0', 'error', 'failed'].includes(status)) {
    return toStr((v as any).message) ?? 'provider_error';
  }
  return null;
}

async function callTurkpinCreateOrder(
  creds: ProviderCreds,
  payload: Record<string, unknown>,
): Promise<TurkpinCallResult> {
  const { username, password } = splitUserPass(creds.apiKey);
  const actions = ['create_order', 'order_create', 'new_order', 'place_order'];
  let last: TurkpinCallResult | null = null;

  for (const action of actions) {
    const requestPayload: Record<string, unknown> = {
      action,
      username,
      user: username,
      email: username,
      password,
      pass: password,
      api_key: creds.apiKey,
      format: 'json',
      ...payload,
    };

    const res = await postTurkpin(creds.apiUrl, requestPayload);
    last = { action, rawText: res.rawText, rawJson: res.rawJson };

    if (!res.ok) continue;
    if (!providerError(res.rawJson)) return last;
  }

  if (last) return last;
  throw new Error('turkpin_no_response');
}

function extractOrderNo(v: unknown): string | null {
  if (!isObj(v)) return null;
  return (
    toStr((v as any).order_id) ??
    toStr((v as any).order_no) ??
    toStr((v as any).siparis_no) ??
    toStr((v as any).id) ??
    toStr((v as any).reference)
  );
}

function extractDeliveryText(v: unknown): string | null {
  const collect = (arr: unknown[]): string[] => {
    const out: string[] = [];
    for (const x of arr) {
      const s = toStr(x);
      if (s) out.push(s);
      else if (isObj(x)) {
        const cand = toStr((x as any).code) ?? toStr((x as any).pin) ?? toStr((x as any).value);
        if (cand) out.push(cand);
      }
    }
    return out;
  };

  if (typeof v === 'string') {
    const s = v.trim();
    return s.length ? s : null;
  }

  if (!isObj(v)) return null;

  const direct =
    toStr((v as any).delivery_content) ??
    toStr((v as any).codes) ??
    toStr((v as any).code) ??
    toStr((v as any).pin);
  if (direct) return direct;

  for (const k of ['codes', 'pins', 'epin_codes', 'items', 'data']) {
    const val = (v as any)[k];
    if (Array.isArray(val)) {
      const joined = collect(val).join('\n').trim();
      if (joined) return joined;
    } else if (isObj(val)) {
      const nested =
        toStr((val as any).delivery_content) ??
        toStr((val as any).code) ??
        toStr((val as any).pin);
      if (nested) return nested;
      for (const nk of ['codes', 'pins', 'items']) {
        const arr = (val as any)[nk];
        if (Array.isArray(arr)) {
          const joined = collect(arr).join('\n').trim();
          if (joined) return joined;
        }
      }
    }
  }

  return null;
}

function extractOptionsMap(rawOptions: unknown): Record<string, string> {
  const obj = parseJsonSafe<Record<string, unknown>>(rawOptions);
  if (!obj || !isObj(obj)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    const s = toStr(v);
    if (s) out[k] = s;
  }
  return out;
}

export async function fulfillTurkpinOrderItems(
  orderId: string,
  logger?: { error?: (...args: any[]) => void; info?: (...args: any[]) => void },
): Promise<void> {
  const rows = await db
    .select({
      itemId: order_items.id,
      itemOptions: order_items.options,
      itemQuantity: order_items.quantity,
      itemTurkpinOrderNo: order_items.turkpin_order_no,
      productName: products.name,
      providerId: products.api_provider_id,
      epinProductId: products.epin_product_id,
      epinGameId: products.epin_game_id,
      autoDeliveryEnabled: products.auto_delivery_enabled,
      productType: products.product_type,
      minOrder: products.min_order,
      maxOrder: products.max_order,
    })
    .from(order_items)
    .innerJoin(products, eq(products.id, order_items.product_id))
    .where(
      and(
        eq(order_items.order_id, orderId as any),
        eq(products.auto_delivery_enabled as any, 1 as any),
        isNull(order_items.turkpin_order_no),
        or(
          eq(products.product_type as any, 'epin' as any),
          eq(products.product_type as any, 'topup' as any),
          eq(products.delivery_type as any, 'api' as any),
        ),
      ),
    );

  if (!rows.length) return;

  for (const row of rows) {
    const itemId = String(row.itemId);
    const productName = String(row.productName ?? 'Ürün');
    try {
      const providerId = toStr(row.providerId);
      const epinProductId = toStr(row.epinProductId);
      const gameId = toStr(row.epinGameId);
      const qty = Math.max(1, toNum(row.itemQuantity, 1));

      if (!providerId || !epinProductId) {
        await db
          .update(order_items)
          .set({ delivery_status: 'failed' as any, updated_at: sql`NOW(3)` })
          .where(eq(order_items.id, itemId as any));
        await addTimeline(
          orderId,
          'turkpin_delivery',
          `Turkpin teslimat başarısız: ${productName} — sağlayıcı veya epin_product_id eksik`,
        );
        continue;
      }

      const creds = await loadProviderCreds(providerId);
      if (!creds) {
        await db
          .update(order_items)
          .set({ delivery_status: 'failed' as any, updated_at: sql`NOW(3)` })
          .where(eq(order_items.id, itemId as any));
        await addTimeline(
          orderId,
          'turkpin_delivery',
          `Turkpin teslimat başarısız: ${productName} — sağlayıcı bulunamadı/pasif`,
        );
        continue;
      }

      const optionsMap = extractOptionsMap(row.itemOptions);

      const requestPayload: Record<string, unknown> = {
        product_id: epinProductId,
        service: epinProductId,
        epin_product_id: epinProductId,
        quantity: qty,
        game_id: gameId ?? undefined,
        list_type: (toStr(row.productType) ?? 'epin').toLowerCase(),
        ...optionsMap,
      };

      const result = await callTurkpinCreateOrder(creds, requestPayload);
      const err = providerError(result.rawJson);
      if (err) throw new Error(err);

      const orderNo = extractOrderNo(result.rawJson) ?? `TP_${Date.now()}`;
      const deliveryContent = extractDeliveryText(result.rawJson);

      await db
        .update(order_items)
        .set({
          turkpin_order_no: orderNo as any,
          delivery_status: (deliveryContent ? 'delivered' : 'processing') as any,
          activation_code: (deliveryContent ? deliveryContent.split('\n')[0] : null) as any,
          delivery_content: (deliveryContent ?? null) as any,
          delivered_at: (deliveryContent ? sql`NOW(3)` : null) as any,
          updated_at: sql`NOW(3)`,
        })
        .where(eq(order_items.id, itemId as any));

      await addTimeline(
        orderId,
        'turkpin_delivery',
        deliveryContent
          ? `Turkpin teslimat tamamlandı: ${productName} → #${orderNo}`
          : `Turkpin siparişi gönderildi: ${productName} → #${orderNo}`,
      );

      logger?.info?.({ itemId, orderNo, action: result.action }, 'turkpin_order_sent');
    } catch (err: any) {
      logger?.error?.({ err, itemId }, 'turkpin_order_failed');
      await db
        .update(order_items)
        .set({ delivery_status: 'failed' as any, updated_at: sql`NOW(3)` })
        .where(eq(order_items.id, itemId as any))
        .catch(() => {});
      await addTimeline(
        orderId,
        'turkpin_delivery',
        `Turkpin teslimat başarısız: ${productName} — ${String(err?.message ?? err).slice(0, 160)}`,
      ).catch(() => {});
    }
  }
}

