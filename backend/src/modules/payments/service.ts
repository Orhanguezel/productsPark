// ===================================================================
// FILE: src/modules/payments/service.ts
// ===================================================================

import { db } from "@/db/client";
import { paymentProviders } from "./schema";
import { eq } from "drizzle-orm";

type RawConfig = Record<string, unknown>;

const safeParseJson = (val: string | null): RawConfig => {
  if (!val) return {};
  try {
    const parsed = JSON.parse(val);
    return parsed && typeof parsed === "object" ? (parsed as RawConfig) : {};
  } catch {
    return {};
  }
};

export type PaytrProviderConfig = {
  merchantId: string;
  merchantKey: string;
  merchantSalt: string;
  okUrl: string | null;
  failUrl: string | null;
  testMode: number;
};

/**
 * payment_providers tablosundan PayTR konfigürasyonu okur.
 *
 * Örnek:
 *  key = "paytr"
 *  public_config:
 *    { "ok_url": "...", "fail_url": "...", "test_mode": 1 }
 *  secret_config:
 *    { "merchant_id": "...", "merchant_key": "...", "merchant_salt": "..." }
 */
export async function getPaytrConfig(
  providerKey = "paytr"
): Promise<PaytrProviderConfig> {
  const [row] = await db
    .select()
    .from(paymentProviders)
    .where(eq(paymentProviders.key, providerKey))
    .limit(1);

  if (!row) {
    throw new Error("paytr_provider_not_configured");
  }

  const pub = safeParseJson(row.publicConfig);
  const sec = safeParseJson(row.secretConfig);

  const merchantId =
    (sec.merchant_id as string | undefined) ??
    (sec.MERCHANT_ID as string | undefined);
  const merchantKey =
    (sec.merchant_key as string | undefined) ??
    (sec.MERCHANT_KEY as string | undefined);
  const merchantSalt =
    (sec.merchant_salt as string | undefined) ??
    (sec.MERCHANT_SALT as string | undefined);

  if (!merchantId || !merchantKey || !merchantSalt) {
    throw new Error("paytr_credentials_not_configured");
  }

  const okUrl =
    (pub.ok_url as string | undefined) ??
    (pub.MERCHANT_OK_URL as string | undefined) ??
    (pub.okUrl as string | undefined) ??
    null;

  const failUrl =
    (pub.fail_url as string | undefined) ??
    (pub.MERCHANT_FAIL_URL as string | undefined) ??
    (pub.failUrl as string | undefined) ??
    null;

  const rawTestMode =
    (pub.test_mode as string | number | undefined) ??
    (pub.TEST_MODE as string | number | undefined);

  const testMode =
    rawTestMode === undefined
      ? 1
      : typeof rawTestMode === "number"
      ? rawTestMode
      : Number(rawTestMode) || 1;

  return {
    merchantId,
    merchantKey,
    merchantSalt,
    okUrl,
    failUrl,
    testMode,
  };
}
