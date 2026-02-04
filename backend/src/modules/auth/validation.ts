// =============================================================
// FILE: src/modules/auth/validation.ts
// FINAL — Auth + Admin Users validations (schema uyumlu)
// =============================================================

import { z } from 'zod';
import { boolLike } from '@/modules/_shared/common';

export const roleEnum = z.enum(['admin', 'moderator', 'user']);

/* ----------------------------- AUTH (public) ---------------------------- */

export const signupBody = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),

  full_name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().min(6).max(50).optional(),

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
  email: z.string().trim().email(),
  password: z.string().min(6),
  grant_type: z.literal('password').optional(),
});

export const updateBody = z.object({
  email: z.string().trim().email().optional(),
  password: z.string().min(6).optional(),
});

/* ----------------------------- PASSWORD RESET --------------------------- */

export const passwordResetRequestBody = z.object({
  email: z.string().trim().email(),
});

export const passwordResetConfirmBody = z.object({
  token: z.string().min(10),
  password: z.string().min(6),
});

/* ----------------------------- AUTH admin endpoints ---------------------- */

export const adminListQuery = z.object({
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).max(1_000_000).default(0),
});

export const adminRoleBody = z
  .object({
    user_id: z.string().uuid().optional(),
    email: z.string().trim().email().optional(),
    role: roleEnum,
  })
  .refine((v: { user_id?: string; email?: string }) => v.user_id || v.email, { message: 'user_id_or_email_required' });

export const adminMakeByEmailBody = z.object({
  email: z.string().trim().email(),
});

/* ----------------------------- /admin/users module ----------------------- */

export const adminUsersListQuery = z.object({
  q: z.string().optional(),
  role: roleEnum.optional(),
  is_active: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).max(1_000_000).default(0),
  sort: z.enum(['created_at', 'email', 'last_login_at']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

export const adminUserUpdateBody = z
  .object({
    full_name: z.string().trim().min(2).max(100).optional(),
    phone: z.string().trim().min(6).max(50).optional(),
    email: z.string().trim().email().optional(),
    is_active: boolLike.optional(),
  })
  .strict();

export const adminUserSetActiveBody = z.object({
  is_active: boolLike,
});

export const adminUserSetRolesBody = z.object({
  roles: z.array(roleEnum).default([]),
});

export const adminUserSetPasswordBody = z.object({
  password: z.string().min(8).max(200),
});
