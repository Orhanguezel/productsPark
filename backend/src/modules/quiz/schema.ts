// ────────────────────────────────────────────────────────────────────────────────
// FILE: src/modules/quiz/schema.ts
// ────────────────────────────────────────────────────────────────────────────────
import {
  mysqlTable,
  char,
  text,
  varchar,
  tinyint,
  int,
  datetime,
  index,
  uniqueIndex,
  foreignKey,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { users } from '@/modules/auth/schema';

export const questions = mysqlTable(
  'quiz_questions',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    text: text('text').notNull(),
    difficulty: varchar('difficulty', { length: 32 }), // optional: 'easy' | 'medium' | 'hard'
    is_active: tinyint('is_active').notNull().default(1),

    created_at: datetime('created_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`) // drizzle updates via $onUpdateFn in mysql-core >= 0.32
      .$onUpdateFn(() => new Date()),
  },
  (t) => [index('idx_questions_active').on(t.is_active)]
);

export const questionOptions = mysqlTable(
  'quiz_question_options',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    question_id: char('question_id', { length: 36 }).notNull(),
    text: text('text').notNull(),
    is_correct: tinyint('is_correct').notNull().default(0),

    created_at: datetime('created_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`) // updated by app
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index('idx_qo_question').on(t.question_id),
    index('idx_qo_correct').on(t.is_correct),
    foreignKey({
      columns: [t.question_id],
      foreignColumns: [questions.id],
      name: 'fk_qo_question',
    }).onDelete('cascade').onUpdate('cascade'),
  ]
);

export const attempts = mysqlTable(
  'quiz_attempts',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    user_id: char('user_id', { length: 36 }).notNull(),
    status: varchar('status', { length: 16 }).notNull().default('active'), // 'active' | 'finished'

    started_at: datetime('started_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    ended_at: datetime('ended_at', { fsp: 3 }),

    duration_sec: int('duration_sec'),
    score: int('score').notNull().default(0),
    total_questions: int('total_questions').notNull().default(0),
    total_correct: int('total_correct').notNull().default(0),

    created_at: datetime('created_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`) // updated by app
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index('idx_attempts_user').on(t.user_id),
    index('idx_attempts_status').on(t.status),
    foreignKey({
      columns: [t.user_id],
      foreignColumns: [users.id],
      name: 'fk_attempts_user',
    }).onDelete('cascade').onUpdate('cascade'),
  ]
);

export const attemptAnswers = mysqlTable(
  'quiz_attempt_answers',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    attempt_id: char('attempt_id', { length: 36 }).notNull(),
    question_id: char('question_id', { length: 36 }).notNull(),
    option_id: char('option_id', { length: 36 }).notNull(),
    is_correct: tinyint('is_correct').notNull().default(0),
    answered_at: datetime('answered_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    uniqueIndex('ux_attempt_question').on(t.attempt_id, t.question_id),
    index('idx_answer_attempt').on(t.attempt_id),
    index('idx_answer_question').on(t.question_id),
    index('idx_answer_option').on(t.option_id),
    foreignKey({ columns: [t.attempt_id], foreignColumns: [attempts.id], name: 'fk_ans_attempt' })
      .onDelete('cascade')
      .onUpdate('cascade'),
    foreignKey({ columns: [t.question_id], foreignColumns: [questions.id], name: 'fk_ans_question' })
      .onDelete('cascade')
      .onUpdate('cascade'),
    foreignKey({ columns: [t.option_id], foreignColumns: [questionOptions.id], name: 'fk_ans_option' })
      .onDelete('cascade')
      .onUpdate('cascade'),
  ]
);

export type QuestionRow = typeof questions.$inferSelect;
export type QuestionInsert = typeof questions.$inferInsert;
export type QuestionOptionRow = typeof questionOptions.$inferSelect;
export type QuestionOptionInsert = typeof questionOptions.$inferInsert;
export type AttemptRow = typeof attempts.$inferSelect;
export type AttemptInsert = typeof attempts.$inferInsert;
export type AttemptAnswerRow = typeof attemptAnswers.$inferSelect;
export type AttemptAnswerInsert = typeof attemptAnswers.$inferInsert;

