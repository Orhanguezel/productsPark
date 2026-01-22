// ===================================================================
// FILE: src/modules/siteSettings/service.ts
// FINAL — Site settings service (SMTP/Storage/Telegram/SMM/Google)
// - Telegram: enabled + webhookEnabled + per-event flags + templates + chat routing
// - ADD: ticket_replied event (admin reply -> user notification)
// ===================================================================

import { db } from '@/db/client';
import { siteSettings } from './schema';
import { inArray } from 'drizzle-orm';
import { env } from '@/core/env';

/* ---------------------------------------------------------------
 * Shared helpers
 * --------------------------------------------------------------- */

const normalizeSettingValue = (raw: unknown): string => {
  const s = raw == null ? '' : String(raw);
  const trimmed = s.trim();
  if (!trimmed) return '';

  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed === 'string' || typeof parsed === 'number' || typeof parsed === 'boolean') {
      return String(parsed);
    }
  } catch {
    // plain string
  }

  return s;
};

const toBool = (raw: string | null | undefined): boolean => {
  const s = normalizeSettingValue(raw).trim().toLowerCase();
  if (!s) return false;
  return ['1', 'true', 'yes', 'y', 'on'].includes(s);
};

const toNumberOrNull = (raw: string | null | undefined): number | null => {
  const s = normalizeSettingValue(raw).trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

async function getSettingsMap(keys: readonly string[]): Promise<Map<string, string>> {
  if (!keys.length) return new Map();

  const rows = await db
    .select()
    .from(siteSettings)
    .where(inArray(siteSettings.key, keys as unknown as string[]));

  const map = new Map<string, string>();
  for (const r of rows) {
    map.set(r.key, normalizeSettingValue(r.value));
  }
  return map;
}

/* ---------------------------------------------------------------
 * SMTP SETTINGS
 * --------------------------------------------------------------- */

const SMTP_KEYS = [
  'smtp_host',
  'smtp_port',
  'smtp_username',
  'smtp_password',
  'smtp_from_email',
  'smtp_from_name',
  'smtp_ssl',
] as const;

export type SmtpSettings = {
  host: string | null;
  port: number | null;
  username: string | null;
  password: string | null;
  fromEmail: string | null;
  fromName: string | null;
  secure: boolean;
};

export async function getSmtpSettings(): Promise<SmtpSettings> {
  const map = await getSettingsMap(SMTP_KEYS);

  const host = map.get('smtp_host') ?? null;
  const port = toNumberOrNull(map.get('smtp_port')) ?? null;
  const username = map.get('smtp_username') ?? null;
  const password = map.get('smtp_password') ?? null;
  const fromEmail = map.get('smtp_from_email') ?? null;
  const fromName = map.get('smtp_from_name') ?? null;
  const secure = toBool(map.get('smtp_ssl'));

  return { host, port, username, password, fromEmail, fromName, secure };
}

/* ---------------------------------------------------------------
 * STORAGE SETTINGS
 * --------------------------------------------------------------- */

const STORAGE_KEYS = [
  'storage_driver',
  'storage_local_root',
  'storage_local_base_url',
  'cloudinary_cloud_name',
  'cloudinary_api_key',
  'cloudinary_api_secret',
  'cloudinary_folder',
  'cloudinary_unsigned_preset',
  'storage_cdn_public_base',
  'storage_public_api_base',
] as const;

export type StorageDriver = 'local' | 'cloudinary';

export type StorageSettings = {
  driver: StorageDriver;
  localRoot: string | null;
  localBaseUrl: string | null;
  cloudName: string | null;
  apiKey: string | null;
  apiSecret: string | null;
  folder: string | null;
  unsignedUploadPreset: string | null;
  cdnPublicBase?: string | null;
  publicApiBase?: string | null;
};

const toDriver = (raw: string | null | undefined): StorageDriver => {
  const v = normalizeSettingValue(raw).trim().toLowerCase();
  if (v === 'local' || v === 'cloudinary') return v as StorageDriver;

  const envRaw = (env.STORAGE_DRIVER || '').trim().toLowerCase();
  if (envRaw === 'local' || envRaw === 'cloudinary') return envRaw as StorageDriver;

  return 'cloudinary';
};

export async function getStorageSettings(): Promise<StorageSettings> {
  const map = await getSettingsMap(STORAGE_KEYS);

  const driver = toDriver(map.get('storage_driver'));

  const localRoot = map.get('storage_local_root') ?? env.LOCAL_STORAGE_ROOT ?? null;
  const localBaseUrl = map.get('storage_local_base_url') ?? env.LOCAL_STORAGE_BASE_URL ?? null;
  const cdnPublicBase = map.get('storage_cdn_public_base') ?? env.STORAGE_CDN_PUBLIC_BASE ?? null;
  const publicApiBase = map.get('storage_public_api_base') ?? env.STORAGE_PUBLIC_API_BASE ?? null;

  const cloudName =
    map.get('cloudinary_cloud_name') ??
    env.CLOUDINARY_CLOUD_NAME ??
    (env.CLOUDINARY as any)?.cloudName ??
    null;

  const apiKey =
    map.get('cloudinary_api_key') ??
    env.CLOUDINARY_API_KEY ??
    (env.CLOUDINARY as any)?.apiKey ??
    null;

  const apiSecret =
    map.get('cloudinary_api_secret') ??
    env.CLOUDINARY_API_SECRET ??
    (env.CLOUDINARY as any)?.apiSecret ??
    null;

  const folder =
    map.get('cloudinary_folder') ??
    env.CLOUDINARY_FOLDER ??
    (env.CLOUDINARY as any)?.folder ??
    null;

  const unsignedUploadPreset =
    map.get('cloudinary_unsigned_preset') ??
    env.CLOUDINARY_UNSIGNED_PRESET ??
    (env.CLOUDINARY as any)?.unsignedUploadPreset ??
    (env.CLOUDINARY as any)?.uploadPreset ??
    null;

  return {
    driver,
    localRoot,
    localBaseUrl,
    cloudName,
    apiKey,
    apiSecret,
    folder,
    unsignedUploadPreset,
    cdnPublicBase,
    publicApiBase,
  };
}

/* ---------------------------------------------------------------
 * TELEGRAM SETTINGS + TEMPLATES
 * --------------------------------------------------------------- */

export type TelegramEvent =
  | 'deposit_approved'
  | 'new_deposit_request'
  | 'new_payment_request'
  | 'new_order'
  | 'new_ticket'
  | 'ticket_replied';

export type TelegramTemplates = Partial<Record<TelegramEvent, string>>;

export type TelegramSettings = {
  enabled: boolean;
  webhookEnabled: boolean;

  botToken: string | null;

  defaultChatId: string | null; // routing
  legacyChatId: string | null;

  events: Record<TelegramEvent, boolean>;
  templates: TelegramTemplates;
};

const TELEGRAM_KEYS = [
  'telegram_notifications_enabled',
  'telegram_webhook_enabled',

  'telegram_bot_token',
  'telegram_default_chat_id',
  'telegram_chat_id',

  // event flags
  'deposit_approved_telegram',
  'new_deposit_request_telegram',
  'new_payment_request_telegram',
  'new_order_telegram',
  'new_ticket_telegram',
  'ticket_replied_telegram',

  // templates
  'telegram_template_deposit_approved',
  'telegram_template_new_deposit_request',
  'telegram_template_new_payment_request',
  'telegram_template_new_order',
  'telegram_template_new_ticket',
  'telegram_template_ticket_replied',
] as const;

export async function getTelegramSettings(): Promise<TelegramSettings> {
  const map = await getSettingsMap(TELEGRAM_KEYS);

  const enabled = toBool(map.get('telegram_notifications_enabled'));
  const webhookEnabled = toBool(map.get('telegram_webhook_enabled'));

  const botToken =
    (map.get('telegram_bot_token')?.trim() ? map.get('telegram_bot_token') : null) ??
    (env.TELEGRAM_BOT_TOKEN ? String(env.TELEGRAM_BOT_TOKEN) : null);

  // PRIMARY = telegram_chat_id, fallback = telegram_default_chat_id
  const primaryChatId =
    (map.get('telegram_chat_id')?.trim() ? map.get('telegram_chat_id') : null) ?? null;

  const fallbackDefaultChatId =
    (map.get('telegram_default_chat_id')?.trim() ? map.get('telegram_default_chat_id') : null) ??
    null;

  const defaultChatId = primaryChatId ?? fallbackDefaultChatId ?? null;
  const legacyChatId = primaryChatId;

  const events: Record<TelegramEvent, boolean> = {
    deposit_approved: toBool(map.get('deposit_approved_telegram')),
    new_deposit_request: toBool(map.get('new_deposit_request_telegram')),
    new_payment_request: toBool(map.get('new_payment_request_telegram')),
    new_order: toBool(map.get('new_order_telegram')),
    new_ticket: toBool(map.get('new_ticket_telegram')),
    ticket_replied: toBool(map.get('ticket_replied_telegram')),
  };

  const templates: TelegramTemplates = {
    deposit_approved: map.get('telegram_template_deposit_approved') ?? '',
    new_deposit_request: map.get('telegram_template_new_deposit_request') ?? '',
    new_payment_request: map.get('telegram_template_new_payment_request') ?? '',
    new_order: map.get('telegram_template_new_order') ?? '',
    new_ticket: map.get('telegram_template_new_ticket') ?? '',
    ticket_replied: map.get('telegram_template_ticket_replied') ?? '',
  };

  return {
    enabled,
    webhookEnabled,
    botToken,
    defaultChatId,
    legacyChatId,
    events,
    templates,
  };
}

/* ---------------------------------------------------------------
 * SMM API SETTINGS
 * --------------------------------------------------------------- */

const SMM_KEYS = ['smm_api_url', 'smm_api_key', 'smm_api_default_type'] as const;

export type SmmSettings = {
  apiUrl: string | null;
  apiKey: string | null;
  defaultType: string | null;
};

export async function getSmmSettings(): Promise<SmmSettings> {
  const map = await getSettingsMap(SMM_KEYS);

  return {
    apiUrl: map.get('smm_api_url') ?? null,
    apiKey: map.get('smm_api_key') ?? null,
    defaultType: map.get('smm_api_default_type') ?? null,
  };
}

/* ---------------------------------------------------------------
 * GOOGLE OAUTH / reCAPTCHA SETTINGS (site_settings only)
 * --------------------------------------------------------------- */

const GOOGLE_KEYS = [
  'google_client_id',
  'google_client_secret',
  'recaptcha_site_key',
  'recaptcha_secret_key',
] as const;

export type GoogleSettings = {
  clientId: string | null;
  clientSecret: string | null;
  recaptchaSiteKey: string | null;
  recaptchaSecretKey: string | null;
};

export async function getGoogleSettings(): Promise<GoogleSettings> {
  const map = await getSettingsMap(GOOGLE_KEYS);

  return {
    clientId: map.get('google_client_id') ?? null,
    clientSecret: map.get('google_client_secret') ?? null,
    recaptchaSiteKey: map.get('recaptcha_site_key') ?? null,
    recaptchaSecretKey: map.get('recaptcha_secret_key') ?? null,
  };
}

export async function getSiteSettingsMap(keys: readonly string[]): Promise<Map<string, string>> {
  return getSettingsMap(keys);
}
