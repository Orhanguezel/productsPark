// =============================================================
// FILE: src/integrations/types/users.ts
// FINAL — User/Admin types + normalizers (central types barrel)
// FIX: AdminUserView created_at/last_login_at now ALWAYS string (never null)
// - Prevents Reports.tsx date parsing errors
// - exactOptionalPropertyTypes friendly
// =============================================================

import { isUnknownRow, getStringProp, getBoolProp } from '@/integrations/types';

export type UserRoleName = 'admin' | 'moderator' | 'user';

/** Admin API ham cevabı (role veya roles gelebilir) */
export type AdminUserRaw = Record<string, unknown>;

export type AdminUserView = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;

  is_active: boolean;

  /**
   * IMPORTANT:
   * Reports/dashboard gibi yerlerde Date parse için string gerekiyor.
   * Bu yüzden normalizer burada boş string fallback üretir (null değil).
   */
  created_at: string; // ISO or '' (never null)
  last_login_at: string; // ISO or '' (never null)

  wallet_balance: number;

  roles: UserRoleName[];

  // Optional derived fields (set edilirse Date olmalı; undefined verilmez)
  created_at_date?: Date;
  last_login_at_date?: Date;
};

export type UserRole = {
  id: string;
  user_id: string;
  role: UserRoleName;
  created_at?: string;
};

/* ---- Admin users list/update payload tipleri ---- */
export type AdminUsersListParams = {
  q?: string;
  role?: UserRoleName;
  is_active?: boolean;
  limit?: number;
  offset?: number;
  sort?: 'created_at' | 'email' | 'last_login_at';
  order?: 'asc' | 'desc';
};

export type AdminUpdateUserBody = {
  id: string;
  full_name?: string;
  phone?: string;
  email?: string;
  is_active?: boolean;
};

export type AdminSetActiveBody = { id: string; is_active: boolean };
export type AdminSetRolesBody = { id: string; roles: UserRoleName[] };
export type AdminSetPasswordBody = { id: string; password: string };
export type AdminRemoveUserBody = { id: string };

export type AdminRoleByUserOrEmailBody = {
  user_id?: string;
  email?: string;
  role: UserRoleName;
};

export type AdminMakeByEmailBody = { email: string };

/* -------------------- helpers -------------------- */

function asRole(v: unknown): UserRoleName | null {
  const s = String(v ?? '').toLowerCase();
  return s === 'admin' || s === 'moderator' || s === 'user' ? (s as UserRoleName) : null;
}

function coerceRoles(raw: AdminUserRaw): UserRoleName[] {
  if (!isUnknownRow(raw)) return [];

  const roleVal = raw.role;
  if (roleVal != null) {
    const r = asRole(roleVal);
    return r ? [r] : [];
  }

  const src = raw.roles;
  if (Array.isArray(src)) {
    const out: UserRoleName[] = [];
    for (const x of src) {
      const r = asRole(x);
      if (r) out.push(r);
    }
    return out;
  }

  if (typeof src === 'string' && src.trim()) {
    const s = src.trim();
    try {
      const parsed: unknown = JSON.parse(s);
      if (Array.isArray(parsed)) {
        const out: UserRoleName[] = [];
        for (const x of parsed) {
          const r = asRole(x);
          if (r) out.push(r);
        }
        return out;
      }
      const single = asRole(parsed);
      return single ? [single] : [];
    } catch {
      const single = asRole(s);
      return single ? [single] : [];
    }
  }

  return [];
}

function toBool01(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v === 1;
  if (typeof v === 'string') return v === '1' || v.toLowerCase() === 'true';
  return false;
}

function toNum0(v: unknown): number {
  if (v == null || v === '') return 0;
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

/* -------------------- normalizers -------------------- */

export function normalizeAdminUser(u: unknown): AdminUserView {
  const row = isUnknownRow(u) ? u : {};

  const id = getStringProp(row, 'id') ?? String(row.id ?? '');
  const email = getStringProp(row, 'email') ?? (row.email === null ? null : null);
  const full_name = getStringProp(row, 'full_name') ?? (row.full_name === null ? null : null);
  const phone = getStringProp(row, 'phone') ?? (row.phone === null ? null : null);

  const is_active = getBoolProp(row, 'is_active') ?? toBool01(row.is_active);

  // ✅ Always string fallback (never null)
  const created_at = getStringProp(row, 'created_at') ?? '';
  const last_login_at = getStringProp(row, 'last_login_at') ?? '';

  const wallet_balance =
    (typeof row.wallet_balance === 'number' ? row.wallet_balance : undefined) ??
    (typeof row.wallet_balance === 'string' ? toNum0(row.wallet_balance) : undefined) ??
    toNum0(row.wallet_balance);

  return {
    id,
    email,
    full_name,
    phone,
    is_active,
    created_at,
    last_login_at,
    wallet_balance,
    roles: coerceRoles(row),
  };
}
