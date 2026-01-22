// =============================================================
// FILE: src/pages/admin/telegram/components/TelegramAutoReplyPanel.tsx
// FINAL — AutoReply config (GET/POST /admin/telegram/autoreply)
// FIX: Boolean("false") bug -> toBoolish normalize
// =============================================================

'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

import {
  useGetTelegramAutoReplyQuery,
  useUpdateTelegramAutoReplyMutation,
} from '@/integrations/hooks';

import type { TelegramAutoReplyMode, TelegramAutoReplyUpdateBody } from '@/integrations/types';

const DEFAULT_TEMPLATE = 'Mesajınız alındı. En kısa sürede dönüş yapacağız.';

const toStr = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v));

const toBoolish = (v: unknown): boolean => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (['true', '1', 'yes', 'y', 'on'].includes(s)) return true;
    if (['false', '0', 'no', 'n', 'off'].includes(s)) return false;
  }
  return false;
};

export default function TelegramAutoReplyPanel() {
  const { data, isLoading, isFetching } = useGetTelegramAutoReplyQuery();
  const [update, { isLoading: saving }] = useUpdateTelegramAutoReplyMutation();

  const [enabled, setEnabled] = React.useState(false);
  const [mode, setMode] = React.useState<TelegramAutoReplyMode>('simple');
  const [template, setTemplate] = React.useState(DEFAULT_TEMPLATE);

  React.useEffect(() => {
    if (!data) return;

    // ✅ FIX: "false" string => false
    setEnabled(toBoolish((data as unknown as Record<string, unknown>).enabled));

    const rawMode = toStr((data as unknown as Record<string, unknown>).mode).trim();
    const m: TelegramAutoReplyMode = rawMode === 'ai' ? 'ai' : 'simple';
    setMode(m);

    const t = toStr((data as unknown as Record<string, unknown>).template).trim();
    setTemplate(t || DEFAULT_TEMPLATE);
  }, [data]);

  const handleSave = async () => {
    const tpl = template.trim();
    if (!tpl) {
      toast.error('Otomatik yanıt mesajı boş olamaz.');
      return;
    }

    const body: TelegramAutoReplyUpdateBody = {
      enabled,
      mode: 'simple', // şimdilik kilitli
      template: tpl,
    };

    try {
      await update(body).unwrap();
      toast.success('Auto-reply kaydedildi');
    } catch (e) {
      console.error(e);
      toast.error((e as { message?: string })?.message || 'Kaydedilemedi');
    }
  };

  if (isLoading || isFetching) {
    return <div className="py-8 text-sm text-muted-foreground">Yükleniyor…</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Otomatik Yanıt</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
          <div className="space-y-1">
            <Label className="text-base font-medium">Auto-reply</Label>
            <p className="text-xs text-muted-foreground">
              Açıkken gelen mesajlara “simple template” yanıt gönderilir.
            </p>
          </div>

          <Switch checked={enabled} onCheckedChange={(v: boolean) => setEnabled(v)} />
        </div>

        <div className="space-y-2">
          <Label>Yanıt Mesajı (Template)</Label>
          <Textarea rows={6} value={template} onChange={(e) => setTemplate(e.target.value)} />
          <p className="text-xs text-muted-foreground">
            Mod: <strong>{mode}</strong>. AI aşamasında “mode: ai” + prompt/agent config eklenecek.
          </p>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
