// =============================================================
// FILE: src/modules/functions/functions.controller.ts
// FINAL — Shopier REAL create-payment (DB config) + callback verify
// - Removes old stub (example.com/mock-shopier)
// - DB-first signature verify (fallback ENV)
// - No duplicate helper/functions
// =============================================================

import type { FastifyReply, FastifyRequest } from 'fastify';
import { sendMailRaw } from '@/modules/mail/service';

// Shopier
import { createShopierForm } from '@/modules/functions/shopier/service';
import { getShopierConfig } from '@/modules/payments/service';

/* -------------------- küçük yardımcılar -------------------- */

function getBaseUrl(req: FastifyRequest): string {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const forwardedHost = req.headers['x-forwarded-host'];
  const hostHeader = req.headers.host;

  const proto =
    (typeof forwardedProto === 'string' && forwardedProto.length > 0
      ? forwardedProto
      : req.protocol) || 'http';

  const hostSource =
    (typeof forwardedHost === 'string' && forwardedHost.length > 0 ? forwardedHost : hostHeader) ||
    'localhost:8081';

  const host = Array.isArray(hostSource) ? hostSource[0] : hostSource;

  return `${proto}://${host}`.replace(/\/+$/, '');
}

function safeString(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const s = v.trim();
  return s.length ? s : undefined;
}

/* ==================================================================
   SHOPIER
   FE beklediği shape: { success, form_action, form_data }
   ================================================================== */

type ShopierCreatePaymentBody = {
  platform_order_id?: string;
  total_order_value?: string | number;
  currency?: 'TRY' | 'TL' | 'USD' | 'EUR';

  product_name?: string;
  product_type?: 0 | 1;

  buyer_name?: string;
  buyer_surname?: string;
  buyer_email?: string;
  buyer_phone?: string;

  buyer_account_age?: string | number;
  buyer_id_nr?: string;

  billing_address?: string;
  billing_city?: string;
  billing_country?: string;
  billing_postcode?: string;

  shipping_address?: string;
  shipping_city?: string;
  shipping_country?: string;
  shipping_postcode?: string;

  is_in_frame?: 0 | 1;
  current_language?: 0 | 1;
};

export async function shopierCreatePayment(req: FastifyRequest, reply: FastifyReply) {
  const body = (req.body as ShopierCreatePaymentBody) || {};

  const platform_order_id = safeString(body.platform_order_id);
  const total_order_value = body.total_order_value;

  if (!platform_order_id) {
    return reply.code(400).send({ success: false, error: 'missing_platform_order_id' });
  }
  if (total_order_value == null) {
    return reply.code(400).send({ success: false, error: 'missing_total_order_value' });
  }

  try {
    // (optional) config check: early fail if provider missing
    await getShopierConfig('shopier');

    const form = await createShopierForm({
      platform_order_id,
      total_order_value,
      currency: body.currency ?? 'TRY',

      product_name: body.product_name ?? 'Wallet Topup',
      product_type: body.product_type ?? 1,

      buyer_name: body.buyer_name,
      buyer_surname: body.buyer_surname,
      buyer_email: body.buyer_email,
      buyer_phone: body.buyer_phone,

      buyer_account_age: body.buyer_account_age,
      buyer_id_nr: body.buyer_id_nr,

      billing_address: body.billing_address,
      billing_city: body.billing_city,
      billing_country: body.billing_country,
      billing_postcode: body.billing_postcode,

      shipping_address: body.shipping_address,
      shipping_city: body.shipping_city,
      shipping_country: body.shipping_country,
      shipping_postcode: body.shipping_postcode,

      is_in_frame: body.is_in_frame ?? 0,
      current_language: body.current_language ?? 0,
    });

    return reply.send({ success: true, form_action: form.form_action, form_data: form.form_data });
  } catch (err: any) {
    req.log.error({ err: err?.message || err, stack: err?.stack }, 'shopier-create-payment failed');
    return reply.code(500).send({ success: false, error: 'shopier_create_failed' });
  }
}

/* ==================================================================
   EMAIL SERVİSLERİ
   ================================================================== */

type SendEmailBody = {
  to?: string;
  subject?: string;
  html?: string;
  text?: string;
  template_key?: string;
  variables?: Record<string, unknown>;
};

function buildTemplatedEmail(
  template_key: string,
  variables: Record<string, unknown> | undefined,
): { subject?: string; html?: string; text?: string } {
  const v = (variables || {}) as Record<string, unknown>;

  if (template_key === 'order_received') {
    const customer_name = (v.customer_name as string | undefined) ?? 'Müşteri';
    const order_number = (v.order_number as string | undefined) ?? '—';
    const final_amount = (v.final_amount as string | number | undefined) ?? '0.00';
    const status = (v.status as string | undefined) ?? 'İşleniyor';
    const site_name = (v.site_name as string | undefined) ?? 'Platform';

    const subject = `${site_name} – Siparişiniz alındı (#${order_number})`;

    const html = `
      <div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#111827;line-height:1.5;">
        <h2 style="font-size:18px;margin-bottom:8px;">Merhaba ${customer_name},</h2>
        <p style="margin:0 0 12px 0;">
          #${order_number} numaralı siparişiniz başarıyla alındı.
        </p>
        <p style="margin:0 0 8px 0;">
          Sipariş tutarı: <strong>${final_amount}</strong><br/>
          Durum: <strong>${status}</strong>
        </p>
        <p style="margin-top:16px;">
          En kısa sürede işleme alınacaktır.<br/>
          <strong>${site_name} Ekibi</strong>
        </p>
      </div>
    `;

    const text = [
      `Merhaba ${customer_name},`,
      '',
      `#${order_number} numaralı siparişiniz başarıyla alındı.`,
      `Tutar: ${final_amount}`,
      `Durum: ${status}`,
      '',
      `En kısa sürede işleme alınacaktır.`,
      `${site_name} Ekibi`,
    ].join('\n');

    return { subject, html, text };
  }

  const subject = template_key;
  const text = `Template: ${template_key}\n\n${JSON.stringify(variables ?? {}, null, 2)}`;
  const html = `<pre>${text}</pre>`;
  return { subject, html, text };
}

export async function sendEmail(req: FastifyRequest, reply: FastifyReply) {
  const body = (req.body as SendEmailBody) || {};
  let { to, subject, html, text, template_key, variables } = body;

  if (!to) return reply.code(400).send({ success: false, error: 'missing_to' });

  if (template_key) {
    const tpl = buildTemplatedEmail(template_key, variables);
    subject = subject || tpl.subject;
    html = html || tpl.html;
    text = text || tpl.text;
  }

  if (!subject) return reply.code(400).send({ success: false, error: 'missing_subject' });

  try {
    const plain =
      text ||
      (html
        ? html
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
        : undefined);

    await sendMailRaw({
      to,
      subject,
      html: html || undefined,
      text: plain,
    });

    req.log.info({ to, subject, template_key }, 'send-email success');
    return reply.send({ success: true });
  } catch (err) {
    req.log.error({ err, to, subject, template_key }, 'send-email failed');
    return reply.code(500).send({ success: false, error: 'send_email_failed' });
  }
}

type ManualDeliveryEmailBody = {
  to?: string;
  customer_name?: string;
  order_number?: string;
  delivery_content?: string;
  site_name?: string;
};

export async function manualDeliveryEmail(req: FastifyRequest, reply: FastifyReply) {
  const body = (req.body as ManualDeliveryEmailBody) || {};
  const { to, customer_name, order_number, delivery_content, site_name } = body;

  if (!to || !delivery_content) {
    return reply.code(400).send({ success: false, error: 'missing_to_or_delivery_content' });
  }

  const safeSiteName = site_name || 'Dijital Market';
  const safeCustomer = customer_name || 'Müşterimiz';

  const subject = order_number
    ? `${safeSiteName} – Sipariş Teslimatı (#${order_number})`
    : `${safeSiteName} – Sipariş Teslimatı`;

  const escapedContent = delivery_content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br/>');

  const html = `
    <div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#111827;line-height:1.5;">
      <h2 style="font-size:18px;margin-bottom:8px;">Merhaba ${safeCustomer},</h2>
      ${
        order_number
          ? `<p style="margin:0 0 12px 0;">#${order_number} numaralı siparişinizin teslimat detayları aşağıdadır:</p>`
          : `<p style="margin:0 0 12px 0;">Siparişinizin teslimat detayları aşağıdadır:</p>`
      }
      <div style="margin:16px 0;padding:12px;border-radius:8px;background:#f9fafb;white-space:pre-wrap;">
        ${escapedContent}
      </div>
      <p style="margin-top:16px;">
        İyi günlerde kullanmanız dileğiyle,<br/>
        <strong>${safeSiteName} Ekibi</strong>
      </p>
    </div>
  `;

  const textLines = [
    `Merhaba ${safeCustomer},`,
    '',
    order_number
      ? `#${order_number} numaralı siparişinizin teslimat detayları aşağıdadır:`
      : `Siparişinizin teslimat detayları aşağıdadır:`,
    '',
    delivery_content,
    '',
    `İyi günlerde kullanmanız dileğiyle,`,
    `${safeSiteName} Ekibi`,
  ];

  try {
    await sendMailRaw({
      to,
      subject,
      html,
      text: textLines.join('\n'),
    });

    req.log.info({ to, order_number }, 'manual-delivery-email sent successfully');
    return reply.send({ success: true });
  } catch (err) {
    req.log.error({ err, to, order_number }, 'manual-delivery-email failed');
    return reply.code(500).send({ success: false, error: 'manual_delivery_email_failed' });
  }
}

/* ==================================================================
   TELEGRAM / SMM / TURKPIN
   ================================================================== */

type MySQL = { query<T = any[]>(sql: string, params?: unknown[]): Promise<[T, unknown]> };

type ApiProviderDbRow = {
  id: string;
  name: string;
  type: string;
  credentials: string | Record<string, unknown> | null;
  is_active: 0 | 1;
};

type TurkpinProviderConfig = {
  id: string;
  name: string;
  providerType: string;
  apiUrl: string;
  apiKey: string;
  username: string;
  password: string;
  credentials: Record<string, unknown>;
};

type TurkpinCallResult = {
  ok: boolean;
  status: number;
  rawText: string;
  rawJson: unknown;
  actionUsed: string;
};

function getMysql(req: FastifyRequest): MySQL {
  const s = req.server as any;
  const r = req as any;
  const db = s.mysql ?? r.mysql ?? s.db ?? s.mariadb ?? null;
  if (!db?.query) {
    throw new Error('mysql_pool_not_found');
  }
  return db as MySQL;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function parseJsonObject(v: unknown): Record<string, unknown> {
  if (typeof v === 'string') {
    try {
      const j = JSON.parse(v) as unknown;
      return isRecord(j) ? j : {};
    } catch {
      return {};
    }
  }
  return isRecord(v) ? v : {};
}

function pickStr(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string') {
      const s = v.trim();
      if (s) return s;
    }
    if (typeof v === 'number' || typeof v === 'boolean') {
      const s = String(v).trim();
      if (s) return s;
    }
  }
  return undefined;
}

function pickNum(obj: Record<string, unknown>, keys: string[], fallback = 0): number {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string') {
      const n = Number(v.replace(',', '.').trim());
      if (Number.isFinite(n)) return n;
    }
  }
  return fallback;
}

function pickBool(obj: Record<string, unknown>, keys: string[], fallback = false): boolean {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v !== 0;
    if (typeof v === 'string') {
      const s = v.trim().toLowerCase();
      if (['1', 'true', 'yes', 'on', 'ok', 'active'].includes(s)) return true;
      if (['0', 'false', 'no', 'off', 'inactive'].includes(s)) return false;
    }
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

async function loadTurkpinProvider(req: FastifyRequest, providerId: string): Promise<TurkpinProviderConfig> {
  const mysql = getMysql(req);

  const [rows] = await mysql.query<ApiProviderDbRow[]>(
    `SELECT id, name, \`type\`, credentials, is_active
     FROM api_providers
     WHERE id = ?
     LIMIT 1`,
    [providerId],
  );

  if (!rows?.length) throw new Error('provider_not_found');

  const row = rows[0];
  const creds = parseJsonObject(row.credentials);

  const apiUrl = pickStr(creds, ['api_url', 'apiUrl']);
  const apiKey = pickStr(creds, ['api_key', 'apiKey']);
  const { username, password } = splitUserPass(apiKey ?? '');

  if (row.is_active !== 1) throw new Error('provider_inactive');
  if (!apiUrl) throw new Error('missing_api_url');
  if (!apiKey) throw new Error('missing_api_key');

  return {
    id: row.id,
    name: row.name,
    providerType: row.type,
    apiUrl,
    apiKey,
    username,
    password,
    credentials: creds,
  };
}

async function postTurkpin(
  url: string,
  payload: Record<string, unknown>,
  asForm: boolean,
): Promise<{ ok: boolean; status: number; rawText: string; rawJson: unknown }> {
  const body = asForm
    ? new URLSearchParams(
        Object.entries(payload).map(([k, v]) => [k, v == null ? '' : String(v)]),
      ).toString()
    : JSON.stringify(payload);

  const res = await fetch(url, {
    method: 'POST',
    headers: asForm
      ? {
          'content-type': 'application/x-www-form-urlencoded',
          accept: 'application/json, text/plain, */*',
          'user-agent': 'Mozilla/5.0 (compatible; ProductSpark/1.0)',
        }
      : {
          'content-type': 'application/json',
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
    // response text olarak kalır
  }

  return {
    ok: res.ok,
    status: res.status,
    rawText,
    rawJson,
  };
}

function hasProviderError(j: unknown): string | undefined {
  if (!isRecord(j)) return undefined;
  const explicitError = pickStr(j, ['error', 'err', 'error_message']);
  if (explicitError) return explicitError;

  const status = pickStr(j, ['status', 'success', 'result']);
  if (status && ['false', '0', 'error', 'failed'].includes(status.toLowerCase())) {
    return pickStr(j, ['error', 'message', 'msg']) ?? 'provider_error';
  }
  return undefined;
}

async function callTurkpinAction(
  cfg: TurkpinProviderConfig,
  actions: string[],
  params: Record<string, unknown>,
): Promise<TurkpinCallResult> {
  const uniqueActions = [...new Set(actions.map((x) => x.trim()).filter(Boolean))];

  let last: TurkpinCallResult | null = null;
  for (const action of uniqueActions) {
    const payload: Record<string, unknown> = {
      action,
      username: cfg.username,
      user: cfg.username,
      email: cfg.username,
      mail: cfg.username,
      password: cfg.password,
      pass: cfg.password,
      sifre: cfg.password,
      api_key: cfg.apiKey,
      format: 'json',
      ...params,
    };

    // Bu tip API'ler çoğunlukla form-urlencoded bekliyor; json'u da fallback deneyelim.
    for (const asForm of [true, false]) {
      const r = await postTurkpin(cfg.apiUrl, payload, asForm);
      last = { ...r, actionUsed: action };

      // HTTP OK değilse diğer aksiyonu dene
      if (!r.ok) continue;

      // Provider explicit hata döndürmediyse başarılı kabul edelim.
      if (!hasProviderError(r.rawJson)) return last;
    }
  }

  return (
    last ?? {
      ok: false,
      status: 502,
      rawText: 'no_attempt',
      rawJson: null,
      actionUsed: uniqueActions[0] ?? 'unknown',
    }
  );
}

function toArray(v: unknown): unknown[] {
  if (Array.isArray(v)) return v;
  if (isRecord(v)) {
    for (const k of ['data', 'items', 'list', 'games', 'products', 'result']) {
      if (Array.isArray(v[k])) return v[k] as unknown[];
    }
  }
  return [];
}

function extractGames(v: unknown): Array<{ id: string; name: string }> {
  const src = toArray(v);
  const out: Array<{ id: string; name: string }> = [];

  for (const item of src) {
    if (!isRecord(item)) continue;
    const id = pickStr(item, ['id', 'game_id', 'gid', 'code']);
    const name = pickStr(item, ['name', 'game_name', 'title']);
    if (!id || !name) continue;
    out.push({ id, name });
  }

  return out;
}

function extractProducts(v: unknown): Array<{
  id: string;
  name: string;
  price: number;
  stock: number;
  min_order: number;
  max_order: number;
  tax_type: number;
  pre_order: boolean;
  min_barem?: number;
  max_barem?: number;
  barem_step?: number;
}> {
  const src = toArray(v);
  const out: Array<{
    id: string;
    name: string;
    price: number;
    stock: number;
    min_order: number;
    max_order: number;
    tax_type: number;
    pre_order: boolean;
    min_barem?: number;
    max_barem?: number;
    barem_step?: number;
  }> = [];

  for (const item of src) {
    if (!isRecord(item)) continue;

    const id = pickStr(item, ['id', 'product_id', 'pid', 'service_id', 'code']);
    const name = pickStr(item, ['name', 'product_name', 'title']);
    if (!id || !name) continue;

    const min_barem = pickNum(item, ['min_barem', 'min_step'], 0);
    const max_barem = pickNum(item, ['max_barem', 'max_step'], 0);
    const barem_step = pickNum(item, ['barem_step', 'step'], 0);

    out.push({
      id,
      name,
      price: pickNum(item, ['price', 'sale_price', 'amount'], 0),
      stock: pickNum(item, ['stock', 'quantity', 'available'], 0),
      min_order: pickNum(item, ['min_order', 'min', 'min_qty'], 1),
      max_order: pickNum(item, ['max_order', 'max', 'max_qty'], 0),
      tax_type: pickNum(item, ['tax_type', 'tax'], 0),
      pre_order: pickBool(item, ['pre_order', 'preorder', 'allow_preorder'], false),
      ...(min_barem > 0 ? { min_barem } : {}),
      ...(max_barem > 0 ? { max_barem } : {}),
      ...(barem_step > 0 ? { barem_step } : {}),
    });
  }

  return out;
}

function extractBalance(v: unknown): { balance: number | null; currency: string | null } {
  if (typeof v === 'string') {
    const trimmed = v.trimStart().toLowerCase();
    if (trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html')) {
      return { balance: null, currency: null };
    }
    const direct = Number(v.replace(',', '.').trim());
    if (Number.isFinite(direct)) return { balance: direct, currency: null };

    const m = v.match(/(-?\d+(?:[.,]\d+)?)/);
    if (m) {
      const parsed = Number(m[1].replace(',', '.'));
      if (Number.isFinite(parsed)) return { balance: parsed, currency: null };
    }
  }

  if (!isRecord(v)) return { balance: null, currency: null };

  const balance = pickNum(v, ['balance', 'bakiye', 'funds', 'credit'], Number.NaN);
  const currency = pickStr(v, ['currency', 'curr', 'unit']) ?? null;
  if (Number.isFinite(balance)) return { balance, currency };

  for (const k of ['data', 'result']) {
    if (!isRecord(v[k])) continue;
    const nested = v[k] as Record<string, unknown>;
    const b = pickNum(nested, ['balance', 'bakiye', 'funds', 'credit'], Number.NaN);
    const c = pickStr(nested, ['currency', 'curr', 'unit']) ?? null;
    if (Number.isFinite(b)) return { balance: b, currency: c };
  }

  return { balance: null, currency: null };
}

async function persistProviderBalance(
  req: FastifyRequest,
  provider: TurkpinProviderConfig,
  balance: number,
  currency: string | null,
) {
  const mysql = getMysql(req);
  const nowIso = new Date().toISOString();

  const nextCreds = {
    ...provider.credentials,
    balance,
    last_balance_check: nowIso,
    ...(currency ? { currency } : {}),
  };

  await mysql.query(`UPDATE api_providers SET credentials = ?, updated_at = NOW(3) WHERE id = ?`, [
    JSON.stringify(nextCreds),
    provider.id,
  ]);
}

export async function sendTelegramNotification(req: FastifyRequest, reply: FastifyReply) {
  const body = (req.body as Record<string, unknown>) || {};
  req.log.info(body, 'telegram stub');
  return reply.send({ success: true });
}

export async function smmApiOrder(req: FastifyRequest, reply: FastifyReply) {
  req.log.info({ body: req.body }, 'smm-api-order stub');
  return reply.send({ success: true, order_id: `SMM_${Date.now()}`, status: 'processing' });
}

export async function smmApiStatus(req: FastifyRequest, reply: FastifyReply) {
  req.log.info({ body: req.body }, 'smm-api-status stub');
  return reply.send({ success: true, status: 'completed' });
}

export async function turkpinGameList(req: FastifyRequest, reply: FastifyReply) {
  const body = (req.body as Record<string, unknown>) || {};
  const providerId = safeString(body.providerId) ?? safeString(body.provider_id);
  const listType = safeString(body.listType)?.toLowerCase() === 'topup' ? 'topup' : 'epin';

  if (!providerId) {
    return reply.code(400).send({ success: false, error: 'missing_provider_id' });
  }

  try {
    const provider = await loadTurkpinProvider(req, providerId);
    const res = await callTurkpinAction(
      provider,
      [`${listType}_game_list`, 'game_list', 'games', 'get_games', 'list_games'],
      { list_type: listType, type: listType },
    );

    const games = extractGames(res.rawJson);
    if (!games.length) {
      return reply.code(502).send({
        success: false,
        error: hasProviderError(res.rawJson) ?? 'empty_games_response',
      });
    }

    return reply.send({ success: true, games });
  } catch (err: any) {
    req.log.error({ err, body }, 'turkpin-game-list failed');
    return reply.code(502).send({ success: false, error: err?.message ?? 'turkpin_game_list_failed' });
  }
}

export async function turkpinProductList(req: FastifyRequest, reply: FastifyReply) {
  const body = (req.body as Record<string, unknown>) || {};
  const providerId = safeString(body.providerId) ?? safeString(body.provider_id);
  const gameId = safeString(body.gameId) ?? safeString(body.game_id);
  const listType = safeString(body.listType)?.toLowerCase() === 'topup' ? 'topup' : 'epin';

  if (!providerId) {
    return reply.code(400).send({ success: false, error: 'missing_provider_id' });
  }
  if (!gameId) {
    return reply.code(400).send({ success: false, error: 'missing_game_id' });
  }

  try {
    const provider = await loadTurkpinProvider(req, providerId);
    const res = await callTurkpinAction(
      provider,
      [`${listType}_product_list`, 'product_list', 'products', 'get_products', 'list_products'],
      {
        list_type: listType,
        type: listType,
        game_id: gameId,
        gid: gameId,
        category_id: gameId,
      },
    );

    const products = extractProducts(res.rawJson);
    if (!products.length) {
      return reply.code(502).send({
        success: false,
        error: hasProviderError(res.rawJson) ?? 'empty_products_response',
      });
    }

    return reply.send({ success: true, products });
  } catch (err: any) {
    req.log.error({ err, body }, 'turkpin-product-list failed');
    return reply
      .code(502)
      .send({ success: false, error: err?.message ?? 'turkpin_product_list_failed' });
  }
}

export async function turkpinBalance(req: FastifyRequest, reply: FastifyReply) {
  const body = (req.body as Record<string, unknown>) || {};
  const providerId = safeString(body.providerId) ?? safeString(body.provider_id);

  if (!providerId) {
    return reply.code(400).send({ success: false, error: 'missing_provider_id' });
  }

  try {
    const provider = await loadTurkpinProvider(req, providerId);
    const res = await callTurkpinAction(
      provider,
      ['balance', 'get_balance', 'account_balance', 'bakiye', 'user_balance', 'getBalance'],
      {},
    );
    const parsed = extractBalance(res.rawJson);

    if (parsed.balance == null || Number.isNaN(parsed.balance)) {
      const raw = String(res.rawText ?? '');
      const rawLower = raw.toLowerCase();
      const isWaf = rawLower.includes('cloudflare') || rawLower.includes('attention required');
      return reply.code(502).send({
        success: false,
        message: isWaf ? 'provider_blocked_by_waf' : 'bad_provider_response',
        error: isWaf
          ? 'Cloudflare WAF engeli — sunucu IP beyaz listeye alınmalı'
          : hasProviderError(res.rawJson) ?? 'invalid_balance_response',
        action: res.actionUsed,
      });
    }

    const currency =
      parsed.currency ?? pickStr(provider.credentials, ['currency']) ?? (provider.providerType === 'topup' ? null : 'TRY');

    await persistProviderBalance(req, provider, parsed.balance, currency);

    return reply.send({
      success: true,
      balance: parsed.balance,
      currency,
      action: res.actionUsed,
    });
  } catch (err: any) {
    req.log.error({ err, body }, 'turkpin-balance failed');
    return reply.code(502).send({ success: false, error: err?.message ?? 'turkpin_balance_failed' });
  }
}

export async function turkpinCreateOrder(req: FastifyRequest, reply: FastifyReply) {
  const body = (req.body as Record<string, unknown>) || {};
  const providerId =
    safeString(body.providerId) ?? safeString(body.provider_id) ?? safeString(body.api_provider_id);

  if (!providerId) {
    return reply.code(400).send({ success: false, error: 'missing_provider_id' });
  }

  try {
    const provider = await loadTurkpinProvider(req, providerId);

    const payload =
      (isRecord(body.payload) ? body.payload : null) ??
      (isRecord(body.order) ? body.order : null) ??
      Object.fromEntries(
        Object.entries(body).filter(
          ([k]) => !['providerId', 'provider_id', 'api_provider_id', 'action', 'payload', 'order'].includes(k),
        ),
      );

    const actionFromBody = safeString(body.action);
    const actionCandidates = actionFromBody
      ? [actionFromBody]
      : ['create_order', 'order_create', 'new_order', 'place_order'];

    const res = await callTurkpinAction(provider, actionCandidates, payload);
    const data = isRecord(res.rawJson) ? res.rawJson : {};

    const orderId =
      pickStr(data, ['order_id', 'order_no', 'siparis_no', 'id', 'reference']) ?? `TP_${Date.now()}`;

    const status = pickStr(data, ['status', 'state', 'result']) ?? 'ok';
    const providerErr = hasProviderError(res.rawJson);
    if (providerErr) {
      return reply.code(502).send({ success: false, error: providerErr });
    }

    return reply.send({
      success: true,
      order_id: orderId,
      status,
      action: res.actionUsed,
    });
  } catch (err: any) {
    req.log.error({ err, body }, 'turkpin-create-order failed');
    return reply.code(502).send({ success: false, error: err?.message ?? 'turkpin_create_order_failed' });
  }
}

/* ==================================================================
   Kullanıcı sipariş silme fonksiyonu (stub)
   ================================================================== */

type DeleteUserOrdersBody = { email?: string };

export async function deleteUserOrders(req: FastifyRequest, reply: FastifyReply) {
  const body = (req.body as DeleteUserOrdersBody) || {};
  const email = body.email?.trim();

  if (!email) return reply.code(400).send({ success: false, error: 'missing_email' });

  req.log.info({ email }, 'delete-user-orders stub');
  return reply.send({ success: true, message: `Orders for ${email} would be deleted (stub).` });
}

/* ==================================================================
   Sitemap (XML) – /functions/sitemap
   ================================================================== */

export async function sitemap(req: FastifyRequest, reply: FastifyReply) {
  const base = getBaseUrl(req);

  const urls: Array<{
    path: string;
    changefreq: 'daily' | 'weekly' | 'monthly';
    priority: number;
  }> = [
    { path: '/', changefreq: 'daily', priority: 1.0 },
    { path: '/urunler', changefreq: 'daily', priority: 0.9 },
    { path: '/kampanyalar', changefreq: 'weekly', priority: 0.7 },
    { path: '/hakkimizda', changefreq: 'monthly', priority: 0.5 },
    { path: '/iletisim', changefreq: 'monthly', priority: 0.5 },
  ];

  const xmlBody =
    urls
      .map((u) => {
        const loc = `${base}${u.path}`;
        return [
          '  <url>',
          `    <loc>${loc}</loc>`,
          `    <changefreq>${u.changefreq}</changefreq>`,
          `    <priority>${u.priority.toFixed(1)}</priority>`,
          '  </url>',
        ].join('\n');
      })
      .join('\n') + '\n';

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
${xmlBody}</urlset>`;

  return reply.type('application/xml; charset=utf-8').send(xml);
}

/* ==================================================================
   TEST MAIL
   ================================================================== */

type SendTestMailBody = { to?: string };
type AuthUserShape = { email?: unknown };

function pickReqUserEmail(req: FastifyRequest): string | undefined {
  const u = (req as unknown as { user?: AuthUserShape }).user;
  const email = u?.email;
  if (typeof email !== 'string') return undefined;
  const s = email.trim();
  return s.length ? s : undefined;
}

export async function sendTestMail(req: FastifyRequest, reply: FastifyReply) {
  const body = (req.body as SendTestMailBody) || {};

  const to = typeof body.to === 'string' && body.to.trim() ? body.to.trim() : undefined;
  const fallbackTo = pickReqUserEmail(req);
  const target = to || fallbackTo;

  if (!target) return reply.code(400).send({ ok: false, message: 'missing_to' });

  const siteName = process.env.SITE_NAME || 'Platform';
  const stamp = new Date().toISOString();
  const subject = `${siteName} — SMTP Test (${stamp})`;

  const html = `
    <div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#111827;line-height:1.5;">
      <h2 style="font-size:18px;margin-bottom:8px;">SMTP Test Maili</h2>
      <p style="margin:0 0 12px 0;">
        Bu e-posta SMTP ayarlarınızın çalıştığını doğrulamak için gönderildi.
      </p>
      <div style="margin:16px 0;padding:12px;border-radius:8px;background:#f9fafb;">
        <div><strong>Zaman:</strong> ${stamp}</div>
        <div><strong>Alıcı:</strong> ${target}</div>
      </div>
      <p style="margin-top:16px;">
        <strong>${siteName}</strong>
      </p>
    </div>
  `;

  const text = [
    'SMTP Test Maili',
    '',
    'Bu e-posta SMTP ayarlarınızın çalıştığını doğrulamak için gönderildi.',
    `Zaman: ${stamp}`,
    `Alici: ${target}`,
    '',
    siteName,
  ].join('\n');

  try {
    await sendMailRaw({ to: target, subject, html, text });
    req.log.info({ to: target }, 'send-test-mail success');
    return reply.send({ ok: true });
  } catch (err) {
    req.log.error({ err, to: target }, 'send-test-mail failed');
    return reply.code(500).send({ ok: false, message: 'send_test_mail_failed' });
  }
}

/* ==================================================================
   TELEGRAM SEND TEST (zaten vardı)
   ================================================================== */

type TelegramSendTestBody = {
  bot_token?: string;
  chat_id?: string;
  message?: string;
  parse_mode?: 'HTML' | 'MarkdownV2';
};

export async function telegramSendTest(req: FastifyRequest, reply: FastifyReply) {
  const body = (req.body as TelegramSendTestBody) || {};

  const bot_token = safeString(body.bot_token);
  const chat_id = safeString(body.chat_id);
  const message = safeString(body.message);
  const parse_mode =
    body.parse_mode === 'HTML' || body.parse_mode === 'MarkdownV2' ? body.parse_mode : undefined;

  if (!bot_token || !chat_id || !message) {
    return reply.code(400).send({ ok: false, message: 'missing_fields' });
  }

  const url = `https://api.telegram.org/bot${bot_token}/sendMessage`;

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id,
        text: message,
        ...(parse_mode ? { parse_mode } : {}),
        disable_web_page_preview: true,
      }),
    });

    const data = (await resp.json()) as unknown;

    if (!resp.ok) {
      req.log.warn({ status: resp.status, data }, 'telegram-send-test failed');
      return reply.code(502).send({ ok: false, message: 'telegram_api_error' });
    }

    req.log.info({ chat_id }, 'telegram-send-test success');
    return reply.send({ ok: true });
  } catch (err) {
    req.log.error({ err }, 'telegram-send-test exception');
    return reply.code(500).send({ ok: false, message: 'telegram_send_failed' });
  }
}
