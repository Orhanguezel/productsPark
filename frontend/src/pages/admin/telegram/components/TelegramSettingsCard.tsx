// =============================================================
// FILE: src/pages/admin/telegram/components/TelegramSettingsCard.tsx
// FINAL — Telegram Settings Card (seed-aligned, event-complete)
// - Supports: telegram_default_chat_id, ticket_replied_telegram, template_ticket_replied
// - Switches persist as 'true'|'false' strings
// - Test send uses useTelegramSendMutation (POST /admin/telegram/send)
// =============================================================

'use client';

import * as React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

import { toast } from 'sonner';

import type { Dispatch, SetStateAction } from 'react';
import { useTelegramSendMutation } from '@/integrations/hooks';

type TelegramSettingsShape = {
  telegram_notifications_enabled: string;
  telegram_webhook_enabled: string;

  telegram_bot_token: string;
  telegram_chat_id: string;
  telegram_default_chat_id: string;

  deposit_approved_telegram: string;
  new_deposit_request_telegram: string;
  new_payment_request_telegram: string;
  new_order_telegram: string;
  new_ticket_telegram: string;
  ticket_replied_telegram: string;

  telegram_template_deposit_approved: string;
  telegram_template_new_deposit_request: string;
  telegram_template_new_payment_request: string;
  telegram_template_new_order: string;
  telegram_template_new_ticket: string;
  telegram_template_ticket_replied: string;
};

type Props = {
  settings: TelegramSettingsShape;
  setSettings: Dispatch<SetStateAction<TelegramSettingsShape>>;
};

type TemplateVars = Record<string, string>;

const toBoolish = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const s = value.trim().toLowerCase();
    return s === '1' || s === 'true' || s === 'yes' || s === 'on';
  }
  return false;
};

const boolToDb = (b: boolean): 'true' | 'false' => (b ? 'true' : 'false');

function applyTemplate(template: string, vars: TemplateVars): string {
  const tpl = String(template ?? '');
  return tpl.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m: string, keyRaw: string): string => {
    const key = String(keyRaw);
    return typeof vars[key] === 'string' ? vars[key] : '';
  });
}

type TemplateDef = {
  key: keyof Pick<
    TelegramSettingsShape,
    | 'telegram_template_new_order'
    | 'telegram_template_new_payment_request'
    | 'telegram_template_new_deposit_request'
    | 'telegram_template_deposit_approved'
    | 'telegram_template_new_ticket'
    | 'telegram_template_ticket_replied'
  >;
  title: string;
  helper: string;
};

const TEMPLATE_DEFS: TemplateDef[] = [
  {
    key: 'telegram_template_new_order',
    title: 'Yeni Sipariş Şablonu',
    helper:
      '{{order_number}}, {{customer_name}}, {{customer_email}}, {{customer_phone}}, {{final_amount}}, {{discount}}, {{order_items}}, {{created_at}}',
  },
  {
    key: 'telegram_template_new_payment_request',
    title: 'Yeni Ödeme Talebi Şablonu',
    helper:
      '{{order_number}}, {{customer_name}}, {{customer_email}}, {{customer_phone}}, {{amount}}, {{payment_method}}, {{order_items}}, {{created_at}}',
  },
  {
    key: 'telegram_template_new_deposit_request',
    title: 'Yeni Bakiye Yükleme Talebi Şablonu',
    helper: '{{user_name}}, {{amount}}, {{payment_method}}, {{created_at}}',
  },
  {
    key: 'telegram_template_deposit_approved',
    title: 'Bakiye Yükleme Onaylandı Şablonu',
    helper: '{{user_name}}, {{amount}}, {{created_at}}',
  },
  {
    key: 'telegram_template_new_ticket',
    title: 'Yeni Destek Talebi Şablonu',
    helper: '{{user_name}}, {{subject}}, {{priority}}, {{category}}, {{message}}, {{created_at}}',
  },
  {
    key: 'telegram_template_ticket_replied',
    title: 'Ticket Yanıtlandı Şablonu',
    helper: '{{user_name}}, {{subject}}, {{priority}}, {{message}}, {{created_at}}',
  },
];

function pickErrorMessage(err: unknown): string | undefined {
  const e = err as {
    data?: { message?: unknown; error?: { message?: unknown; details?: unknown } };
    message?: unknown;
  };
  const msg1 = e?.data?.message;
  if (typeof msg1 === 'string' && msg1.trim()) return msg1;
  const msg2 = e?.data?.error?.message;
  if (typeof msg2 === 'string' && msg2.trim()) return msg2;
  const msg3 = e?.message;
  if (typeof msg3 === 'string' && msg3.trim()) return msg3;
  return undefined;
}

export default function TelegramSettingsCard({ settings, setSettings }: Props) {
  const [telegramSend, { isLoading: testing }] = useTelegramSendMutation();

  const previewVars = React.useMemo<TemplateVars>(
    () => ({
      order_number: 'ORD-12345',
      customer_name: 'John Doe',
      customer_email: 'customer@example.com',
      customer_phone: '📱 Telefon: +90 555 555 55 55',
      final_amount: '499.90',
      amount: '499.90',
      discount: '🎁 İndirim: 20 TL',
      order_items: '• Ürün A x1\n• Ürün B x2',
      created_at: new Date().toISOString(),
      payment_method: 'paytr',
      user_name: 'John Doe',
      subject: 'Sipariş Sorusu',
      priority: 'medium',
      category: '📌 Kategori: orders',
      message: 'Merhaba, bu bir test mesajıdır.',
    }),
    [],
  );

  const telegramEnabled = toBoolish(settings.telegram_notifications_enabled);
  const webhookEnabled = toBoolish(settings.telegram_webhook_enabled);

  const targetChatId = (
    settings.telegram_chat_id ||
    settings.telegram_default_chat_id ||
    ''
  ).trim();
  const canTest =
    telegramEnabled && settings.telegram_bot_token.trim().length > 0 && targetChatId.length > 0;

  const setDbFlag = (key: keyof TelegramSettingsShape, v: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: boolToDb(v) }));
  };

  const setStr = (key: keyof TelegramSettingsShape, v: string) => {
    setSettings((prev) => ({ ...prev, [key]: v }));
  };

  const sendTest = async (text: string) => {
    const msg = String(text ?? '').trim();
    if (!msg) return toast.error('Test mesajı boş olamaz.');
    if (!canTest) return toast.error('Test için bildirimler açık + token + chatId gerekir.');

    try {
      const res = await telegramSend({
        title: 'Telegram Test',
        message: msg,
        type: 'test',
        chat_id: targetChatId,
      }).unwrap();

      const ok =
        !!res && typeof res === 'object' && 'ok' in res && Boolean((res as { ok?: unknown }).ok);

      if (ok) toast.success('Test mesajı gönderildi.');
      else toast.error('Telegram testi başarısız.');
    } catch (err) {
      toast.error(`Telegram testi başarısız: ${pickErrorMessage(err) ?? 'Bilinmeyen hata'}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Telegram Ayarları</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="rounded-lg border p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <Label className="text-base font-medium">Telegram Bildirimlerini Etkinleştir</Label>
              <p className="text-xs text-muted-foreground">
                Kapalıysa event mesajları gönderilmez.
              </p>
            </div>
            <Switch
              checked={telegramEnabled}
              onCheckedChange={(v: boolean) => setDbFlag('telegram_notifications_enabled', v)}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <Label className="text-base font-medium">Webhook Enabled</Label>
              <p className="text-xs text-muted-foreground">Inbound + raw reply akışları için.</p>
            </div>
            <Switch
              checked={webhookEnabled}
              onCheckedChange={(v: boolean) => setDbFlag('telegram_webhook_enabled', v)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Bot Token</Label>
            <Input
              type="password"
              value={settings.telegram_bot_token}
              onChange={(e) => setStr('telegram_bot_token', e.target.value)}
              placeholder="123456:ABC-DEF..."
            />
          </div>

          <div className="space-y-2">
            <Label>Primary Chat ID</Label>
            <Input
              value={settings.telegram_chat_id}
              onChange={(e) => setStr('telegram_chat_id', e.target.value)}
              placeholder="-1001234567890"
            />
          </div>

          <div className="space-y-2">
            <Label>Default Chat ID</Label>
            <Input
              value={settings.telegram_default_chat_id}
              onChange={(e) => setStr('telegram_default_chat_id', e.target.value)}
              placeholder="-1001234567890"
            />
          </div>
        </div>

        <div className="rounded-lg border p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Label className="text-sm font-medium">Yeni Sipariş</Label>
            <Switch
              checked={toBoolish(settings.new_order_telegram)}
              onCheckedChange={(v: boolean) => setDbFlag('new_order_telegram', v)}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <Label className="text-sm font-medium">Yeni Ticket</Label>
            <Switch
              checked={toBoolish(settings.new_ticket_telegram)}
              onCheckedChange={(v: boolean) => setDbFlag('new_ticket_telegram', v)}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <Label className="text-sm font-medium">Ticket Yanıtlandı</Label>
            <Switch
              checked={toBoolish(settings.ticket_replied_telegram)}
              onCheckedChange={(v: boolean) => setDbFlag('ticket_replied_telegram', v)}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <Label className="text-sm font-medium">Bakiye Onay</Label>
            <Switch
              checked={toBoolish(settings.deposit_approved_telegram)}
              onCheckedChange={(v: boolean) => setDbFlag('deposit_approved_telegram', v)}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <Label className="text-sm font-medium">Yeni Bakiye Talebi</Label>
            <Switch
              checked={toBoolish(settings.new_deposit_request_telegram)}
              onCheckedChange={(v: boolean) => setDbFlag('new_deposit_request_telegram', v)}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <Label className="text-sm font-medium">Yeni Ödeme Talebi</Label>
            <Switch
              checked={toBoolish(settings.new_payment_request_telegram)}
              onCheckedChange={(v: boolean) => setDbFlag('new_payment_request_telegram', v)}
            />
          </div>
        </div>

        <div className="space-y-4">
          {TEMPLATE_DEFS.map((def) => {
            const tpl = settings[def.key] ?? '';
            const preview = applyTemplate(tpl, previewVars);

            return (
              <div key={def.key} className="space-y-3 rounded-lg border p-4">
                <div className="space-y-1">
                  <Label className="text-base font-medium">{def.title}</Label>
                  <p className="text-xs text-muted-foreground">Değişkenler: {def.helper}</p>
                </div>

                <Textarea rows={8} value={tpl} onChange={(e) => setStr(def.key, e.target.value)} />

                <div className="space-y-2">
                  <Label>Önizleme</Label>
                  <pre className="whitespace-pre-wrap rounded-md bg-muted p-3 text-xs">
                    {preview}
                  </pre>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    disabled={!canTest || testing}
                    onClick={() => void sendTest(preview)}
                  >
                    {testing ? 'Gönderiliyor…' : 'Bu Şablonla Test Gönder'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
