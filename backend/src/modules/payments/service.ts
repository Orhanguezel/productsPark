// ===================================================================
// FILE: src/modules/payments/service.ts
// FINAL — Payment providers config loader (PayTR + Shopier) [FIXED]
// - Reads from payment_providers table (drizzle)
// - STRICT + exactOptionalPropertyTypes friendly
// - PayTR
//   - secret_config: merchant_id, merchant_key, merchant_salt   (snake) ✅
//   - public_config: ok_url, fail_url, notification_url, test_mode ✅
//   - Also supports camelCase keys for portability
//   - Enforces is_active=1
// - Shopier
//   - secret_config: api_key, secret, website_index ✅
//   - public_config: mode (test/live), ok_url, fail_url (optional)
// ===================================================================

import { db } from '@/db/client';
import { paymentProviders } from './schema';
import { and, eq } from 'drizzle-orm';
import { env } from '@/core/env';
import { getSiteSettingsMap } from '@/modules/siteSettings/service';

type RawConfig = Record<string, unknown>;

/* =========================
   JSON helpers
   ========================= */

const isRecord = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);

const safeParseJson = (val: string | null): RawConfig => {
  if (!val) return {};
  try {
    const parsed: unknown = JSON.parse(val);
    return isRecord(parsed) ? (parsed as RawConfig) : {};
  } catch {
    return {};
  }
};

const pickStr = (o: RawConfig, keys: string[]): string | null => {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === 'string') {
      const s = v.trim();
      if (s) return s;
    }
  }
  return null;
};

const pickNum = (o: RawConfig, keys: string[], fallback: number): number => {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string') {
      const s = v.trim();
      if (!s) continue;
      const n = Number(s);
      if (Number.isFinite(n)) return n;
    }
  }
  return fallback;
};

// PayTR test_mode: expects 0/1
const pickNum01 = (o: RawConfig, keys: string[], fallback: 0 | 1): 0 | 1 => {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === 'boolean') return v ? 1 : 0;
    if (typeof v === 'number' && Number.isFinite(v)) return v ? 1 : 0;
    if (typeof v === 'string') {
      const s = v.trim().toLowerCase();
      if (!s) continue;
      if (s === '1' || s === 'true' || s === 'yes' || s === 'on' || s === 'enabled') return 1;
      if (s === '0' || s === 'false' || s === 'no' || s === 'off' || s === 'disabled') return 0;

      const n = Number(s);
      if (Number.isFinite(n)) return n ? 1 : 0;
    }
  }
  return fallback;
};

const cleanSecret = (s: string | null | undefined): string | null => {
  const t = (s ?? '').trim();
  if (!t) return null;
  // ignore template placeholders like "{{PAYTR_MERCHANT_ID}}"
  if (/^\{\{.+\}\}$/.test(t)) return null;
  return t;
};

/* =========================
   PayTR
   ========================= */

export type PaytrProviderConfig = {
  merchantId: string;
  merchantKey: string;
  merchantSalt: string;

  okUrl: string; // PayTR için boş olmamalı (token servisi zorunlu sayıyor)
  failUrl: string;

  notificationUrl: string | null;

  testMode: 0 | 1;
};

export async function getPaytrConfig(providerKey: string = 'paytr'): Promise<PaytrProviderConfig> {
  const [row] = await db
    .select()
    .from(paymentProviders)
    .where(and(eq(paymentProviders.key, providerKey), eq(paymentProviders.isActive, 1)))
    .limit(1);

  if (!row) throw new Error('paytr_provider_not_configured');

  const pub = safeParseJson(row.publicConfig);
  const sec = safeParseJson(row.secretConfig);

  // ✅ DB seed snake_case: merchant_id / merchant_key / merchant_salt
  // ✅ also allow camelCase for portability
  let merchantId =
    cleanSecret(pickStr(sec, ['merchant_id', 'merchantId', 'MERCHANT_ID', 'PAYTR_MERCHANT_ID'])) ??
    null;
  let merchantKey =
    cleanSecret(pickStr(sec, ['merchant_key', 'merchantKey', 'MERCHANT_KEY', 'PAYTR_MERCHANT_KEY'])) ??
    null;
  let merchantSalt =
    cleanSecret(
      pickStr(sec, ['merchant_salt', 'merchantSalt', 'MERCHANT_SALT', 'PAYTR_MERCHANT_SALT']),
    ) ?? null;

  // ✅ DB seed: ok_url / fail_url / notification_url / test_mode
  let okUrl =
    pickStr(pub, ['ok_url', 'okUrl', 'merchant_ok_url', 'MERCHANT_OK_URL', 'PAYTR_OK_URL']) ?? null;
  let failUrl =
    pickStr(pub, [
      'fail_url',
      'failUrl',
      'merchant_fail_url',
      'MERCHANT_FAIL_URL',
      'PAYTR_FAIL_URL',
    ]) ?? null;

  let notificationUrl =
    pickStr(pub, ['notification_url', 'notificationUrl', 'notify_url', 'NOTIFICATION_URL']) ?? null;

  let testMode = pickNum01(pub, ['test_mode', 'testMode', 'TEST_MODE'], 1);

  // fallback: site_settings (legacy)
  if (!merchantId || !merchantKey || !merchantSalt || !okUrl || !failUrl) {
    const map = await getSiteSettingsMap([
      'paytr_merchant_id',
      'paytr_merchant_key',
      'paytr_merchant_salt',
      'paytr_test_mode',
      'paytr_ok_url',
      'paytr_fail_url',
      'paytr_notification_url',
    ] as const);

    if (!merchantId) merchantId = cleanSecret(map.get('paytr_merchant_id')) ?? null;
    if (!merchantKey) merchantKey = cleanSecret(map.get('paytr_merchant_key')) ?? null;
    if (!merchantSalt) merchantSalt = cleanSecret(map.get('paytr_merchant_salt')) ?? null;

    if (!okUrl) {
      const v = map.get('paytr_ok_url');
      if (v && v.trim()) okUrl = v.trim();
    }
    if (!failUrl) {
      const v = map.get('paytr_fail_url');
      if (v && v.trim()) failUrl = v.trim();
    }
    if (!notificationUrl) {
      const v = map.get('paytr_notification_url');
      if (v && v.trim()) notificationUrl = v.trim();
    }

    const tm = map.get('paytr_test_mode');
    if (tm != null && tm !== '') {
      const s = tm.trim().toLowerCase();
      if (['1', 'true', 'yes', 'on', 'enabled'].includes(s)) testMode = 1;
      else if (['0', 'false', 'no', 'off', 'disabled'].includes(s)) testMode = 0;
    }
  }

  // fallback: env
  if (!merchantId) merchantId = cleanSecret(env.PAYTR.MERCHANT_ID) ?? null;
  if (!merchantKey) merchantKey = cleanSecret(env.PAYTR.MERCHANT_KEY) ?? null;
  if (!merchantSalt) merchantSalt = cleanSecret(env.PAYTR.MERCHANT_SALT) ?? null;

  let okUrlFinal = okUrl ?? env.PAYTR.OK_URL ?? null;
  let failUrlFinal = failUrl ?? env.PAYTR.FAIL_URL ?? null;

  if (!okUrlFinal || !failUrlFinal) {
    // createPaytrToken zaten "ok/fail url yoksa invalid request" diye fail ediyordu
    throw new Error('paytr_ok_fail_url_missing');
  }

  const notificationUrlFinal = notificationUrl ?? null;

  if (!merchantId || !merchantKey || !merchantSalt) {
    throw new Error('paytr_credentials_not_configured');
  }

  return {
    merchantId,
    merchantKey,
    merchantSalt,
    okUrl: okUrlFinal,
    failUrl: failUrlFinal,
    notificationUrl: notificationUrlFinal,
    testMode,
  };
}

/* =========================
   Shopier
   ========================= */

export type ShopierProviderConfig = {
  apiKey: string;
  secret: string;
  websiteIndex: number;

  okUrl: string | null;
  failUrl: string | null;
  mode: 'test' | 'live';
};

export async function getShopierConfig(
  providerKey: string = 'shopier',
): Promise<ShopierProviderConfig> {
  const [row] = await db
    .select()
    .from(paymentProviders)
    .where(and(eq(paymentProviders.key, providerKey), eq(paymentProviders.isActive, 1)))
    .limit(1);

  if (!row) throw new Error('shopier_provider_not_configured');

  const pub = safeParseJson(row.publicConfig);
  const sec = safeParseJson(row.secretConfig);

  // ✅ DB seed: api_key / secret / website_index
  // ✅ also allow some legacy/camel keys
  const apiKey =
    pickStr(sec, ['api_key', 'apiKey', 'API_key', 'API_KEY', 'SHOPIER_API_KEY']) ?? null;

  const secret = pickStr(sec, ['secret', 'shopier_secret', 'SHOPIER_SECRET']) ?? null;

  const websiteIndex = pickNum(sec, ['website_index', 'websiteIndex', 'WEBSITE_INDEX'], 1);

  if (!apiKey || !secret) {
    throw new Error('shopier_credentials_not_configured');
  }

  const okUrl = pickStr(pub, ['ok_url', 'okUrl']) ?? null;
  const failUrl = pickStr(pub, ['fail_url', 'failUrl']) ?? null;

  const modeRaw = (pickStr(pub, ['mode', 'MODE']) ?? 'live').toLowerCase();
  const mode: 'test' | 'live' = modeRaw === 'test' ? 'test' : 'live';

  return {
    apiKey,
    secret,
    websiteIndex,
    okUrl,
    failUrl,
    mode,
  };
}
