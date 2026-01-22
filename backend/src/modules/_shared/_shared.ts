// =============================================================
// FILE: src/modules/auth/_shared.ts
// FINAL — Shared helpers for auth module
// =============================================================
import type { users } from '@/modules/auth/schema';

type UserRow = typeof users.$inferSelect;

export const toBool01 = (v: unknown): boolean => (typeof v === 'boolean' ? v : Number(v) === 1);

/** Admin/FE DTO tek yerde */
export function pickUserDto(u: UserRow, role: string) {
  return {
    id: u.id,
    email: u.email,
    full_name: u.full_name ?? null,
    phone: u.phone ?? null,
    email_verified: u.email_verified,
    is_active: u.is_active,
    created_at: u.created_at,
    last_login_at: u.last_sign_in_at,

    // ✅ profil resmi
    profile_image: (u as any).profile_image ?? null,
    profile_image_asset_id: (u as any).profile_image_asset_id ?? null,
    profile_image_alt: (u as any).profile_image_alt ?? null,

    role,
  };
}
