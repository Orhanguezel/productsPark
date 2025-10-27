// ────────────────────────────────────────────────────────────────────────────────
// FILE: src/modules/quiz/service.ts
// ────────────────────────────────────────────────────────────────────────────────
import { and, count, desc, eq, inArray, notInArray, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { env } from '@/core/env';
import {
  questions,
  questionOptions,
  attempts,
  attemptAnswers,
  type AttemptRow,
} from './schema';
import { users } from '@/modules/auth/schema';
import { profiles } from '@/modules/profiles/schema';

const QUIZ_DURATION_SECONDS = env.QUIZ?.DURATION_SECONDS ?? 60;

export function now() {
  return new Date();
}

export function addSeconds(d: Date, s: number) {
  return new Date(d.getTime() + s * 1000);
}

export async function startAttempt(userId: string) {
  // Kullanıcının aktif denemesi varsa, onu döndürelim (tekrar başlatmasın)
  const [existing] = await db
    .select()
    .from(attempts)
    .where(and(eq(attempts.user_id, userId), eq(attempts.status, 'active')))
    .limit(1);

  if (existing) {
    const expiresAt = addSeconds(existing.started_at!, QUIZ_DURATION_SECONDS);
    return { attempt: existing, expiresAt };
  }

  const id = crypto.randomUUID();
  const started_at = now();
  await db.insert(attempts).values({ id, user_id: userId, started_at, status: 'active' });
  return {
    attempt: {
      id,
      user_id: userId,
      started_at,
      status: 'active',
      score: 0,
      total_questions: 0,
      total_correct: 0,
    } as AttemptRow,
    expiresAt: addSeconds(started_at, QUIZ_DURATION_SECONDS),
  };
}

export async function getRandomQuestionForAttempt(attemptId: string) {
  // Bu denemede yanıtlanan soruları dışla
  const answered = await db
    .select({ question_id: attemptAnswers.question_id })
    .from(attemptAnswers)
    .where(eq(attemptAnswers.attempt_id, attemptId));
  const answeredIds = answered.map((r) => r.question_id);

  const rows = await db
    .select()
    .from(questions)
    .where(
      answeredIds.length
        ? and(eq(questions.is_active, 1 as any), notInArray(questions.id, answeredIds))
        : eq(questions.is_active, 1 as any),
    )
    .orderBy(sql`RAND()`) // küçük ölçek için yeterli
    .limit(1);

  const q = rows[0];
  if (!q) return null;

  const opts = await db
    .select()
    .from(questionOptions)
    .where(eq(questionOptions.question_id, q.id));

  return { question: q, options: opts };
}

export async function finalizeAttemptIfExpired(attemptId: string) {
  const [a] = await db.select().from(attempts).where(eq(attempts.id, attemptId)).limit(1);
  if (!a) return null;
  if (a.status === 'finished') return a;

  const deadline = addSeconds(a.started_at!, QUIZ_DURATION_SECONDS);
  const isExpired = now() >= deadline;
  if (!isExpired) return a;

  // finalize
  const [agg] = await db
    .select({
      total: count().as('total'),
      correct: sql<number>`SUM(${attemptAnswers.is_correct})`,
    })
    .from(attemptAnswers)
    .where(eq(attemptAnswers.attempt_id, attemptId));
  const total = Number(agg?.total ?? 0);
  const correct = Number(agg?.correct ?? 0);

  await db
    .update(attempts)
    .set({
      status: 'finished',
      ended_at: deadline,
      duration_sec: QUIZ_DURATION_SECONDS,
      score: correct,
      total_questions: total,
      total_correct: correct,
      updated_at: now(),
    })
    .where(eq(attempts.id, attemptId));

  const [finalRow] = await db.select().from(attempts).where(eq(attempts.id, attemptId)).limit(1);
  return finalRow;
}

export async function submitAnswer(attemptId: string, questionId: string, optionId: string) {
  // deneme oku ve süreyi denetle
  const [a] = await db.select().from(attempts).where(eq(attempts.id, attemptId)).limit(1);
  if (!a) throw new Error('attempt_not_found');
  if (a.status === 'finished') return a;

  const deadline = addSeconds(a.started_at!, QUIZ_DURATION_SECONDS);
  if (now() >= deadline) {
    // süre dolmuş; finalize et
    return await finalizeAttemptIfExpired(attemptId);
  }

  // seçenek doğrula
  const [opt] = await db
    .select()
    .from(questionOptions)
    .where(eq(questionOptions.id, optionId))
    .limit(1);
  if (!opt || opt.question_id !== questionId) throw new Error('invalid_option');

  const is_correct = Number(opt.is_correct ?? 0) === 1 ? 1 : 0;

  // unique (attempt_id, question_id) — UPSERT benzeri: önce var mı bak
  const [existingAns] = await db
    .select()
    .from(attemptAnswers)
    .where(
      and(
        eq(attemptAnswers.attempt_id, attemptId),
        eq(attemptAnswers.question_id, questionId),
      ),
    )
    .limit(1);

  if (!existingAns) {
    await db.insert(attemptAnswers).values({
      id: crypto.randomUUID(),
      attempt_id: attemptId,
      question_id: questionId,
      option_id: optionId,
      is_correct,
    });

    // deneme sayacı güncelle (hafif optimizasyon)
    const incCorrect = is_correct ? 1 : 0;
    await db
      .update(attempts)
      .set({
        total_questions: (a.total_questions ?? 0) + 1,
        total_correct: (a.total_correct ?? 0) + incCorrect,
        score: (a.score ?? 0) + incCorrect,
        updated_at: now(),
      })
      .where(eq(attempts.id, attemptId));
  }

  // süre bitmiş olabilir; tekrar kontrol
  return (
    (await finalizeAttemptIfExpired(attemptId)) ??
    (await db.select().from(attempts).where(eq(attempts.id, attemptId)).limit(1))[0]
  );
}

export async function getLeaderboard(limit = 50) {
  const rows = await db
    .select({
      id: attempts.id,
      user_id: attempts.user_id,
      score: attempts.score,
      total_questions: attempts.total_questions,
      total_correct: attempts.total_correct,
      created_at: attempts.created_at,
      email: users.email,
      full_name: profiles.full_name,
    })
    .from(attempts)
    .leftJoin(users, eq(users.id, attempts.user_id))
    .leftJoin(profiles, eq(profiles.id, attempts.user_id))
    .where(eq(attempts.status, 'finished'))
    .orderBy(desc(attempts.score), desc(attempts.total_correct), desc(attempts.created_at))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    score: r.score ?? 0,
    total_questions: r.total_questions ?? 0,
    total_correct: r.total_correct ?? 0,
    created_at: r.created_at,
    display_name:
      r.full_name && r.full_name.trim() ? r.full_name : r.email ?? '—',
  }));
}
