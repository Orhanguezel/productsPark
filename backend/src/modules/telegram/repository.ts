// ===================================================================
// FILE: src/modules/telegram/repository.ts
// FINAL — Telegram admin repository (inbound list + autoreply get/set)
// - Fix: whereParts typing + cursor logic safety
// - Fix: deterministic upsert for site_settings
// ===================================================================

import { randomUUID } from 'crypto';
import { and, desc, eq, like, or, lt } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { db } from '@/db/client';
import { siteSettings } from '@/modules/siteSettings/schema';
import { getSiteSettingsMap } from '@/modules/siteSettings/service';
import { telegramInboundMessages } from '@/modules/telegram/schema';

export type InboundListParams = {
  chat_id?: string;
  q?: string;
  limit?: number;
  cursor?: string;
};

export type InboundListResult = {
  items: Array<Record<string, unknown>>;
  next_cursor?: string | null;
};

const now = () => new Date();

/** Cursor = base64("created_at_iso|id") */
function encodeCursor(createdAtIso: string, id: string): string {
  return Buffer.from(`${createdAtIso}|${id}`, 'utf8').toString('base64');
}

function decodeCursor(cursor: string): { createdAtIso: string; id: string } | null {
  try {
    const raw = Buffer.from(cursor, 'base64').toString('utf8');
    const [createdAtIso, id] = raw.split('|');
    if (!createdAtIso || !id) return null;

    const d = new Date(createdAtIso);
    if (Number.isNaN(d.getTime())) return null;

    return { createdAtIso: d.toISOString(), id };
  } catch {
    return null;
  }
}

const DEFAULT_TEMPLATE = 'Mesajınızı aldık. En kısa sürede dönüş yapacağız.';

export const TelegramAdminRepo = {
  async listInbound(params: InboundListParams): Promise<InboundListResult> {
    const limit = Math.min(Math.max(params.limit ?? 50, 1), 200);

    const conds: SQL[] = [];

    if (params.chat_id) {
      conds.push(eq(telegramInboundMessages.chat_id, params.chat_id));
    }

    if (params.q) {
      const q = params.q.trim();
      if (q) conds.push(like(telegramInboundMessages.text, `%${q}%`));
    }

    const cur = params.cursor ? decodeCursor(params.cursor) : null;
    if (cur) {
      const cursorDate = new Date(cur.createdAtIso);
      conds.push(
        or(
          lt(telegramInboundMessages.created_at, cursorDate),
          and(
            eq(telegramInboundMessages.created_at, cursorDate),
            lt(telegramInboundMessages.id, cur.id),
          ),
        ) as unknown as SQL,
      );
    }

    const where = conds.length ? (and(...conds) as unknown as SQL) : undefined;

    const rows = await db
      .select()
      .from(telegramInboundMessages)
      .where(where)
      .orderBy(desc(telegramInboundMessages.created_at), desc(telegramInboundMessages.id))
      .limit(limit);

    const items = rows as Array<Record<string, unknown>>;

    const next_cursor =
      items.length === limit
        ? (() => {
            const last = items[items.length - 1];
            const createdAt = last.created_at instanceof Date ? last.created_at : null;
            const id = typeof last.id === 'string' ? last.id : null;
            if (!createdAt || !id) return null;
            return encodeCursor(createdAt.toISOString(), id);
          })()
        : null;

    return { items, next_cursor };
  },

  async getAutoReply(): Promise<{ enabled: boolean; mode: 'simple'; template: string }> {
    const map = await getSiteSettingsMap([
      'telegram_autoreply_enabled',
      'telegram_autoreply_mode',
      'telegram_autoreply_template',
    ]);

    const enabledRaw = String(map.get('telegram_autoreply_enabled') ?? '')
      .trim()
      .toLowerCase();
    const enabled = ['1', 'true', 'yes', 'on', 'y'].includes(enabledRaw);

    const template =
      String(map.get('telegram_autoreply_template') ?? '').trim() || DEFAULT_TEMPLATE;

    // şimdilik sabit
    return { enabled, mode: 'simple', template };
  },

  async upsertAutoReply(input: { enabled?: boolean; template?: string }): Promise<{ ok: true }> {
    const rows: Array<{ key: string; value: string }> = [];

    if (typeof input.enabled === 'boolean') {
      rows.push({ key: 'telegram_autoreply_enabled', value: input.enabled ? 'true' : 'false' });
      rows.push({ key: 'telegram_autoreply_mode', value: 'simple' });
    }

    if (typeof input.template === 'string') {
      const tpl = input.template.trim();
      if (tpl) rows.push({ key: 'telegram_autoreply_template', value: tpl });
    }

    if (!rows.length) return { ok: true };

    for (const r of rows) {
      await db
        .insert(siteSettings)
        .values({
          id: randomUUID(),
          key: r.key,
          value: r.value,
          created_at: now(),
          updated_at: now(),
        } as any)
        .onDuplicateKeyUpdate({
          set: {
            value: r.value as any,
            updated_at: now() as any,
          },
        });
    }

    return { ok: true };
  },
};
