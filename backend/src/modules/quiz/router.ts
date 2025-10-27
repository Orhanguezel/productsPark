
// ────────────────────────────────────────────────────────────────────────────────
// FILE: src/modules/quiz/router.ts
// ────────────────────────────────────────────────────────────────────────────────
import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@/common/middleware/auth';
import {
  adminListQuestions,
  adminCreateQuestion,
  adminUpdateQuestion,
  adminDeleteQuestion,
  adminUpsertMany,
  attemptStart,
  nextQuestion,
  submitAnswerHandler,
  finishAttempt,
  getLeaderboardHandler,
} from './controller';

export async function registerQuiz(app: FastifyInstance) {
  // admin soru CRUD
  app.get('/quiz/v1/admin/questions', { preHandler: [requireAuth] }, adminListQuestions);
  app.post('/quiz/v1/admin/questions', { preHandler: [requireAuth] }, adminCreateQuestion);
  app.put('/quiz/v1/admin/questions', { preHandler: [requireAuth] }, adminUpdateQuestion);
  app.delete('/quiz/v1/admin/questions/:id', { preHandler: [requireAuth] }, adminDeleteQuestion);
  app.post('/quiz/v1/admin/questions/bulk', { preHandler: [requireAuth] }, adminUpsertMany);

  // user akışı
  app.post('/quiz/v1/attempts/start', { preHandler: [requireAuth] }, attemptStart);
  app.get('/quiz/v1/questions/next', { preHandler: [requireAuth] }, nextQuestion); // query: attemptId
  app.post('/quiz/v1/attempts/:id/answer', { preHandler: [requireAuth] }, submitAnswerHandler);
  app.post('/quiz/v1/attempts/:id/finish', { preHandler: [requireAuth] }, finishAttempt);

  // leaderboard (public)
  app.get('/quiz/v1/leaderboard', {}, getLeaderboardHandler);
}
