// ===================================================================
// FILE: src/modules/telegram/admin.controller.ts
// FINAL — Telegram admin controller (inbound list + autoreply)
// ===================================================================

import type { RouteHandler } from 'fastify';
import { TelegramInboundListQuerySchema, TelegramAutoReplyUpdateBodySchema } from './validation';
import { TelegramAdminRepo } from './repository';

type AuthUser =
  | {
      id?: string;
      role?: string;
    }
  | undefined;

function requireAdmin(req: unknown): { ok: true } | { ok: false; status: number; message: string } {
  const r = req as { user?: AuthUser };
  const role = (r.user?.role as string | undefined) ?? 'user';
  if (role !== 'admin') {
    return { ok: false, status: 403, message: 'Bu işlem için admin yetkisi gerekli.' };
  }
  return { ok: true };
}

/** GET /admin/telegram/inbound */
export const listTelegramInboundCtrl: RouteHandler = async (req, reply) => {
  const guard = requireAdmin(req);
  if (!guard.ok) return reply.code(guard.status).send({ message: guard.message });

  try {
    const q = TelegramInboundListQuerySchema.parse((req as { query?: unknown }).query ?? {});
    const result = await TelegramAdminRepo.listInbound(q);
    return reply.code(200).send(result);
  } catch (e: unknown) {
    const err = e as { name?: string; issues?: unknown };
    if (err?.name === 'ZodError') {
      return reply.code(400).send({
        error: { message: 'validation_error', details: (err as any).issues },
      });
    }
    req.log.error(e, 'GET /admin/telegram/inbound failed');
    return reply.code(500).send({ message: 'İşlem gerçekleştirilemedi.' });
  }
};

/** GET /admin/telegram/autoreply */
export const getTelegramAutoReplyCtrl: RouteHandler = async (req, reply) => {
  const guard = requireAdmin(req);
  if (!guard.ok) return reply.code(guard.status).send({ message: guard.message });

  try {
    const cfg = await TelegramAdminRepo.getAutoReply();
    return reply.code(200).send(cfg);
  } catch (e: unknown) {
    req.log.error(e, 'GET /admin/telegram/autoreply failed');
    return reply.code(500).send({ message: 'İşlem gerçekleştirilemedi.' });
  }
};

/** POST /admin/telegram/autoreply */
export const updateTelegramAutoReplyCtrl: RouteHandler = async (req, reply) => {
  const guard = requireAdmin(req);
  if (!guard.ok) return reply.code(guard.status).send({ message: guard.message });

  try {
    const body = TelegramAutoReplyUpdateBodySchema.parse((req as { body?: unknown }).body ?? {});
    const result = await TelegramAdminRepo.upsertAutoReply(body);
    return reply.code(200).send(result);
  } catch (e: unknown) {
    const err = e as { name?: string; issues?: unknown };
    if (err?.name === 'ZodError') {
      return reply.code(400).send({
        error: { message: 'validation_error', details: (err as any).issues },
      });
    }
    req.log.error(e, 'POST /admin/telegram/autoreply failed');
    return reply.code(500).send({ message: 'İşlem gerçekleştirilemedi.' });
  }
};
