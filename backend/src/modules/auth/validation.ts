import { z } from 'zod';

export const signupBody = z.object({
  email: z.string().email(),
  password: z.string().min(6),

  // Top-level opsiyonel alanlar:
  full_name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().min(6).max(50).optional(),

  // Supabase benzeri payload uyumu:
  options: z
    .object({
      emailRedirectTo: z.string().url().optional(),
      data: z
        .object({
          full_name: z.string().trim().min(2).max(100).optional(),
          phone: z.string().trim().min(6).max(50).optional(),
        })
        .partial()
        .optional(),
    })
    .optional(),
});

export const tokenBody = z.object({
  grant_type: z.literal('password'),
  email: z.string().email(),
  password: z.string().min(6),
});

export const updateBody = z.object({
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
});

export const googleBody = z.object({
  id_token: z.string().min(10),
});

/** Admin işlemleri */
export const adminListQuery = z.object({
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).max(1_000_000).default(0),
});

export const adminRoleBody = z.object({
  user_id: z.string().uuid().optional(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'moderator', 'user']),
}).refine(v => v.user_id || v.email, { message: 'user_id_or_email_required' });

export const adminMakeByEmailBody = z.object({
  email: z.string().email(),
});
