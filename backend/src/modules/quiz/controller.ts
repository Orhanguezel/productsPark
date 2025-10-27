
// ────────────────────────────────────────────────────────────────────────────────
// FILE: src/modules/quiz/controller.ts
// ────────────────────────────────────────────────────────────────────────────────
import type { FastifyRequest, RouteHandler } from 'fastify';
import '@fastify/jwt';
import { ZodError } from 'zod';
import { db } from '@/db/client';
import { and, eq, sql, inArray } from 'drizzle-orm';
import { requireAuth } from '@/common/middleware/auth';
import { requireAdmin } from '@/common/middleware/roles';
import { questions, questionOptions } from './schema';
import {
  questionCreateSchema,
  questionUpdateSchema,
  adminUpsertManySchema,
  answerSubmitSchema,
} from './validation';
import {
  startAttempt,
  getRandomQuestionForAttempt,
  submitAnswer,
  finalizeAttemptIfExpired,
  getLeaderboard,
} from './service';

// JWT → userId
function getUserId(req: FastifyRequest) {
  const payload = (req as any)?.user;
  const sub = payload?.sub;
  if (!sub || typeof sub !== 'string') throw new Error('unauthorized');
  return sub as string; // uuid
}

// ── Admin: Soru CRUD ───────────────────────────────────────────────────────────
export const adminListQuestions: RouteHandler = async (req, reply) => {
  await requireAuth(req, reply);
  if (reply.sent) return; await requireAdmin(req, reply); if (reply.sent) return;

  const rows = await db.select().from(questions).orderBy(sql`created_at DESC`).limit(200);
  // options'ları grupla
  const qIds = rows.map((r) => r.id);
  const opts = qIds.length
    ? await db.select().from(questionOptions).where(inArray(questionOptions.question_id, qIds))
    : [];
  const byQ = new Map<string, any[]>();
  for (const o of opts) {
    const arr = byQ.get(o.question_id) ?? [];
    arr.push(o);
    byQ.set(o.question_id, arr);
  }
  return reply.send(rows.map((q) => ({ ...q, options: byQ.get(q.id) ?? [] })));
};

export const adminCreateQuestion: RouteHandler = async (req, reply) => {
  await requireAuth(req, reply); if (reply.sent) return; await requireAdmin(req, reply); if (reply.sent) return;
  try {
    const input = questionCreateSchema.parse(req.body);

    const correctCount = input.options.filter((o) => o.is_correct).length;
    if (correctCount !== 1) {
      return reply.status(400).send({ error: { message: 'exactly_one_correct_option_required' } });
    }

    const qId = input.id ?? crypto.randomUUID();
    await db.insert(questions).values({
      id: qId,
      text: input.text,
      difficulty: input.difficulty,
      is_active: input.is_active ? 1 : 0,
    });

    for (const o of input.options) {
      await db.insert(questionOptions).values({
        id: o.id ?? crypto.randomUUID(),
        question_id: qId,
        text: o.text,
        is_correct: o.is_correct ? 1 : 0,
      });
    }

    return reply.send({ ok: true, id: qId });
  } catch (e) {
    if (e instanceof ZodError) {
      return reply.status(400).send({ error: { message: 'validation_error', details: e.issues } });
    }
    req.log.error(e);
    return reply.status(500).send({ error: { message: 'question_create_failed' } });
  }
};

export const adminUpdateQuestion: RouteHandler = async (req, reply) => {
  await requireAuth(req, reply); if (reply.sent) return; await requireAdmin(req, reply); if (reply.sent) return;
  try {
    const input = questionUpdateSchema.parse(req.body);

    if (input.text !== undefined || input.difficulty !== undefined || input.is_active !== undefined) {
      await db
        .update(questions)
        .set({
          ...(input.text !== undefined ? { text: input.text } : {}),
          ...(input.difficulty !== undefined ? { difficulty: input.difficulty } : {}),
          ...(input.is_active !== undefined ? { is_active: input.is_active ? 1 : 0 } : {}),
        })
        .where(eq(questions.id, input.id));
    }

    if (input.options) {
      // Basit yaklaşım: mevcutları sil & yeniden ekle
      await db.delete(questionOptions).where(eq(questionOptions.question_id, input.id));
      const correctCount = input.options.filter((o) => o.is_correct).length;
      if (correctCount !== 1) {
        return reply.status(400).send({ error: { message: 'exactly_one_correct_option_required' } });
      }
      for (const o of input.options) {
        await db.insert(questionOptions).values({
          id: o.id ?? crypto.randomUUID(),
          question_id: input.id,
          text: o.text,
          is_correct: o.is_correct ? 1 : 0,
        });
      }
    }

    return reply.send({ ok: true });
  } catch (e: any) {
    if (e instanceof ZodError) {
      return reply.status(400).send({ error: { message: 'validation_error', details: e.issues } });
    }
    req.log.error(e);
    return reply.status(500).send({ error: { message: 'question_update_failed' } });
  }
};

export const adminDeleteQuestion: RouteHandler = async (req, reply) => {
  await requireAuth(req, reply); if (reply.sent) return; await requireAdmin(req, reply); if (reply.sent) return;
  try {
    const id = (req.params as any)?.id as string;
    await db.delete(questions).where(eq(questions.id, id));
    return reply.send({ ok: true });
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: { message: 'question_delete_failed' } });
  }
};

export const adminUpsertMany: RouteHandler = async (req, reply) => {
  await requireAuth(req, reply); if (reply.sent) return; await requireAdmin(req, reply); if (reply.sent) return;
  try {
    const input = adminUpsertManySchema.parse(req.body);
    for (const q of input.questions) {
      const exist = await db.select({ id: questions.id }).from(questions).where(eq(questions.id, (q.id ?? '') as any)).limit(1);
      if (!exist?.[0]) {
        // create
        const qId = q.id ?? crypto.randomUUID();
        await db.insert(questions).values({ id: qId, text: q.text, difficulty: q.difficulty, is_active: q.is_active ? 1 : 0 });
        const correctCount = q.options.filter((o) => o.is_correct).length;
        if (correctCount !== 1) throw new Error('one_correct_required');
        for (const o of q.options) {
          await db.insert(questionOptions).values({ id: o.id ?? crypto.randomUUID(), question_id: qId, text: o.text, is_correct: o.is_correct ? 1 : 0 });
        }
      } else {
        // update like above
        await db
          .update(questions)
          .set({ text: q.text, difficulty: q.difficulty, is_active: q.is_active ? 1 : 0 })
          .where(eq(questions.id, (q.id as any)));
        await db.delete(questionOptions).where(eq(questionOptions.question_id, (q.id as any)));
        const correctCount = q.options.filter((o) => o.is_correct).length;
        if (correctCount !== 1) throw new Error('one_correct_required');
        for (const o of q.options) {
          await db.insert(questionOptions).values({ id: o.id ?? crypto.randomUUID(), question_id: (q.id as any), text: o.text, is_correct: o.is_correct ? 1 : 0 });
        }
      }
    }
    return reply.send({ ok: true });
  } catch (e) {
    if (e instanceof ZodError) {
      return reply.status(400).send({ error: { message: 'validation_error', details: e.issues } });
    }
    req.log.error(e);
    return reply.status(500).send({ error: { message: 'bulk_upsert_failed' } });
  }
};

// ── User: Attempt akışı ────────────────────────────────────────────────────────
export const attemptStart: RouteHandler = async (req, reply) => {
  await requireAuth(req, reply); if (reply.sent) return;
  try {
    const userId = getUserId(req);
    const { attempt, expiresAt } = await startAttempt(userId);
    return reply.send({ attempt_id: attempt.id, started_at: attempt.started_at, expires_at: expiresAt });
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: { message: 'attempt_start_failed' } });
  }
};

export const nextQuestion: RouteHandler = async (req, reply) => {
  await requireAuth(req, reply); if (reply.sent) return;
  try {
    const attemptId = (req.query as any)?.attemptId as string;
    if (!attemptId) return reply.status(400).send({ error: { message: 'attemptId_required' } });

    const a = await finalizeAttemptIfExpired(attemptId);
    if (a && a.status === 'finished') return reply.send({ finished: true });

    const payload = await getRandomQuestionForAttempt(attemptId);
    if (!payload) return reply.send({ finished: true }); // sorular bitti

    const { question, options } = payload;
    return reply.send({
      question: { id: question.id, text: question.text, difficulty: question.difficulty },
      options: options.map((o) => ({ id: o.id, text: o.text })),
    });
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: { message: 'next_question_failed' } });
  }
};

export const submitAnswerHandler: RouteHandler = async (req, reply) => {
  await requireAuth(req, reply); if (reply.sent) return;
  try {
    const attemptId = (req.params as any)?.id as string;
    const input = answerSubmitSchema.parse(req.body);
    const a = await submitAnswer(attemptId, input.question_id, input.option_id);
    return reply.send({
      status: a?.status,
      score: a?.score,
      total_questions: a?.total_questions,
      total_correct: a?.total_correct,
    });
  } catch (e) {
    if (e instanceof ZodError) {
      return reply.status(400).send({ error: { message: 'validation_error', details: e.issues } });
    }
    if (e instanceof Error && (e.message === 'invalid_option' || e.message === 'attempt_not_found')) {
      return reply.status(400).send({ error: { message: e.message } });
    }
    req.log.error(e);
    return reply.status(500).send({ error: { message: 'answer_submit_failed' } });
  }
};

export const finishAttempt: RouteHandler = async (req, reply) => {
  await requireAuth(req, reply); if (reply.sent) return;
  try {
    const attemptId = (req.params as any)?.id as string;
    const a = await finalizeAttemptIfExpired(attemptId);
    if (!a) return reply.status(404).send({ error: { message: 'attempt_not_found' } });
    if (a.status !== 'finished') {
      // Manuel bitirme → şimdi bitir
      const finished = await finalizeAttemptIfExpired(attemptId);
      return reply.send({ status: finished?.status, score: finished?.score, total_questions: finished?.total_questions, total_correct: finished?.total_correct });
    }
    return reply.send({ status: a.status, score: a.score, total_questions: a.total_questions, total_correct: a.total_correct });
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: { message: 'attempt_finish_failed' } });
  }
};

export const getLeaderboardHandler: RouteHandler = async (req, reply) => {
  try {
    const limitStr = (req.query as any)?.limit as string | undefined;
    const limit = Math.max(1, Math.min(200, Number(limitStr ?? 50)));
    const rows = await getLeaderboard(limit);
    return reply.send(rows);
  } catch (e) {
    return reply.status(500).send({ error: { message: 'leaderboard_failed' } });
  }
};