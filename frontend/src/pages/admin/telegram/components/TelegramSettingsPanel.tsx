// =============================================================
// FILE: src/pages/admin/telegram/components/TelegramSettingsPanel.tsx
// FINAL — Telegram Settings Panel (site_settings telegram keys only)
// - Loads from useListSiteSettingsAdminQuery
// - Saves via useBulkUpsertSiteSettingsAdminMutation (only telegram keys)
// - Telegram bools persisted as 'true'|'false' strings
// =============================================================

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

import TelegramSettingsCard from './TelegramSettingsCard';

import {
  useListSiteSettingsAdminQuery,
  useBulkUpsertSiteSettingsAdminMutation,
} from '@/integrations/hooks';

import type { AdminSiteSetting, UpsertSiteSettingBody, ValueType } from '@/integrations/types';

// --- Seed aligned keys ---
const TELEGRAM_KEYS = [
  'telegram_notifications_enabled',
  'telegram_webhook_enabled',

  'telegram_bot_token',
  'telegram_chat_id',
  'telegram_default_chat_id',

  'deposit_approved_telegram',
  'new_deposit_request_telegram',
  'new_payment_request_telegram',
  'new_order_telegram',
  'new_ticket_telegram',
  'ticket_replied_telegram',

  'telegram_template_deposit_approved',
  'telegram_template_new_deposit_request',
  'telegram_template_new_payment_request',
  'telegram_template_new_order',
  'telegram_template_new_ticket',
  'telegram_template_ticket_replied',
] as const;

type TelegramKey = (typeof TELEGRAM_KEYS)[number];

const TELEGRAM_BOOL_KEYS = new Set<TelegramKey>([
  'telegram_notifications_enabled',
  'telegram_webhook_enabled',
  'deposit_approved_telegram',
  'new_deposit_request_telegram',
  'new_payment_request_telegram',
  'new_order_telegram',
  'new_ticket_telegram',
  'ticket_replied_telegram',
]);

type TelegramSettingsModel = Record<TelegramKey, string>;

const defaults: TelegramSettingsModel = {
  telegram_notifications_enabled: 'false',
  telegram_webhook_enabled: 'false',

  telegram_bot_token: '',
  telegram_chat_id: '',
  telegram_default_chat_id: '',

  deposit_approved_telegram: 'false',
  new_deposit_request_telegram: 'false',
  new_payment_request_telegram: 'false',
  new_order_telegram: 'false',
  new_ticket_telegram: 'false',
  ticket_replied_telegram: 'false',

  telegram_template_deposit_approved: '',
  telegram_template_new_deposit_request: '',
  telegram_template_new_payment_request: '',
  telegram_template_new_order: '',
  telegram_template_new_ticket: '',
  telegram_template_ticket_replied: '',
};

const isObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);

const toBoolish = (v: unknown): boolean => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    return s === '1' || s === 'true' || s === 'yes' || s === 'on';
  }
  return false;
};

const boolToDb = (b: boolean): 'true' | 'false' => (b ? 'true' : 'false');

const normalizeTemplateValue = (v: unknown): string => {
  // Eski dump: { template: "..." }
  if (isObject(v) && 'template' in v) return String((v as { template?: unknown }).template ?? '');
  return v == null ? '' : String(v);
};

export default function TelegramSettingsPanel() {
  const { data: rows, isLoading, isFetching } = useListSiteSettingsAdminQuery();
  const [bulkUpsert, { isLoading: saving }] = useBulkUpsertSiteSettingsAdminMutation();

  const [model, setModel] = React.useState<TelegramSettingsModel>(defaults);
  const [initialized, setInitialized] = React.useState(false);

  React.useEffect(() => {
    if (!rows || initialized) return;

    const m: TelegramSettingsModel = { ...defaults };

    for (const item of rows as AdminSiteSetting[]) {
      const k = String(item.key ?? '') as TelegramKey;
      if (!TELEGRAM_KEYS.includes(k)) continue;

      let v: unknown = item.value;

      if (k.startsWith('telegram_template_')) v = normalizeTemplateValue(v);

      if (TELEGRAM_BOOL_KEYS.has(k)) {
        m[k] = boolToDb(toBoolish(v));
      } else {
        m[k] = v == null ? '' : String(v);
      }
    }

    setModel(m);
    setInitialized(true);
  }, [rows, initialized]);

  const initialLoading = !initialized && (isLoading || isFetching);

  const guessType = (key: TelegramKey): ValueType => {
    // bool’ları DB’ye string bastığımız için type=string
    if (TELEGRAM_BOOL_KEYS.has(key)) return 'string';
    return 'string';
  };

  const handleSave = async () => {
    try {
      const items: UpsertSiteSettingBody[] = (
        Object.entries(model) as Array<[TelegramKey, string]>
      ).map(([key, value]) => ({
        key,
        value: TELEGRAM_BOOL_KEYS.has(key) ? (toBoolish(value) ? 'true' : 'false') : value,
        value_type: guessType(key),
        group: null,
        description: null,
      }));

      await bulkUpsert({ items }).unwrap();
      toast.success('Telegram ayarları kaydedildi');
    } catch (e) {
      console.error(e);
      toast.error((e as { message?: string })?.message || 'Telegram ayarları kaydedilemedi');
    }
  };

  if (initialLoading) {
    return <div className="py-8 text-sm text-muted-foreground">Yükleniyor…</div>;
  }

  return (
    <div className="space-y-4">
      <TelegramSettingsCard settings={model} setSettings={setModel} />

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Kaydediliyor…' : 'Kaydet'}
        </Button>
      </div>
    </div>
  );
}
