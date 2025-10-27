
// ────────────────────────────────────────────────────────────────────────────────
// FILE: src/modules/quiz/validation.ts
// ────────────────────────────────────────────────────────────────────────────────
import { z } from 'zod';

export const optionSchema = z.object({
  id: z.string().uuid().optional(),
  text: z.string().min(1),
  is_correct: z.boolean(),
});

export const questionCreateSchema = z.object({
  id: z.string().uuid().optional(),
  text: z.string().min(1),
  difficulty: z.string().max(32).optional(),
  is_active: z.boolean().optional().default(true),
  options: z.array(optionSchema).min(2), // en az 2 şık
});

export const questionUpdateSchema = questionCreateSchema.partial().extend({
  id: z.string().uuid(),
});

export const adminUpsertManySchema = z.object({
  questions: z.array(questionCreateSchema),
});

export const startAttemptSchema = z.object({}); // body yok

export const answerSubmitSchema = z.object({
  question_id: z.string().uuid(),
  option_id: z.string().uuid(),
});

export const finishAttemptSchema = z.object({}); // body yok

export type QuestionCreateInput = z.infer<typeof questionCreateSchema>;
export type QuestionUpdateInput = z.infer<typeof questionUpdateSchema>;
export type AdminUpsertManyInput = z.infer<typeof adminUpsertManySchema>;
export type StartAttemptInput = z.infer<typeof startAttemptSchema>;
export type AnswerSubmitInput = z.infer<typeof answerSubmitSchema>;

