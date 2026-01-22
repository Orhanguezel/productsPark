// =============================================================
// FILE: src/pages/admin/telegram/components/TelegramInboundPanel.tsx
// FINAL — Inbound messages list (GET /admin/telegram/inbound)
// - exactOptionalPropertyTypes safe: omit undefined params
// - Uses FE types: from_first_name/last_name, text nullable, next_cursor
// =============================================================

'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

import { useListTelegramInboundQuery } from '@/integrations/hooks';
import type {
  TelegramInboundListParams,
  TelegramInboundMessage,
} from '@/integrations/types/telegram_inbound';

function toLocalDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString();
}

function formatFromName(m: TelegramInboundMessage): string {
  const fn = (m.from_first_name ?? '').trim();
  const ln = (m.from_last_name ?? '').trim();
  const full = [fn, ln].filter(Boolean).join(' ').trim();
  return full || '-';
}

function formatText(v: string | null | undefined): string {
  const s = (v ?? '').trim();
  return s || '(no text)';
}

export default function TelegramInboundPanel() {
  const [q, setQ] = React.useState('');
  const [chatId, setChatId] = React.useState('');
  const [limit, setLimit] = React.useState(50);

  const [cursor, setCursor] = React.useState<string | undefined>(undefined);

  // exactOptionalPropertyTypes: undefined alanları objeye koyma
  const params: TelegramInboundListParams = React.useMemo(() => {
    const p: TelegramInboundListParams = {};

    const qv = q.trim();
    if (qv) p.q = qv;

    const cv = chatId.trim();
    if (cv) p.chat_id = cv;

    if (Number.isFinite(limit)) p.limit = limit;

    if (cursor) p.cursor = cursor;

    return p;
  }, [q, chatId, limit, cursor]);

  const { data, isFetching, refetch } = useListTelegramInboundQuery(params);

  const items = (data?.items ?? []) as TelegramInboundMessage[];
  const nextCursor = data?.next_cursor ?? null;

  const handleRefresh = () => {
    // refresh: cursor reset
    setCursor(undefined);
    refetch();
  };

  const handleLoadMore = () => {
    if (!nextCursor) return;
    setCursor(String(nextCursor));
  };

  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle>Gelen Mesajlar</CardTitle>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ara: mesaj / username / chat…"
          />
          <Input
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            placeholder="Chat ID (opsiyonel)"
          />
          <Input
            value={String(limit)}
            onChange={(e) => {
              const n = Number(e.target.value || 50) || 50;
              setLimit(Math.max(10, Math.min(200, n)));
            }}
            placeholder="Limit"
          />

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={isFetching}>
              {isFetching ? 'Yenileniyor…' : 'Yenile'}
            </Button>

            <Button
              variant="secondary"
              onClick={handleLoadMore}
              disabled={isFetching || !nextCursor}
              title={!nextCursor ? 'Daha fazla kayıt yok' : undefined}
            >
              {isFetching ? 'Yükleniyor…' : 'Daha Fazla'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[160px]">Tarih</TableHead>
                <TableHead className="w-[140px]">Chat</TableHead>
                <TableHead className="w-[240px]">Gönderen</TableHead>
                <TableHead>Mesaj</TableHead>
                <TableHead className="w-[140px]">Kaynak</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-sm text-muted-foreground">
                    Kayıt yok.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs">{toLocalDate(m.created_at)}</TableCell>
                    <TableCell className="text-xs">{m.chat_id}</TableCell>
                    <TableCell className="text-xs">
                      <div className="space-y-1">
                        <div>{formatFromName(m)}</div>
                        <div className="text-muted-foreground">@{m.from_username ?? '-'}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm whitespace-pre-wrap">
                      {formatText(m.text)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{m.chat_type ?? 'telegram'}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {nextCursor ? (
          <p className="mt-3 text-xs text-muted-foreground">Sonraki sayfa mevcut (cursor).</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
