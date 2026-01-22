// =============================================================
// FILE: src/integrations/types/profile.ts
// FINAL — Profile types + normalizers + body mappers
// - strict/no-any
// - tolerant normalize (snake/camel)
// - exactOptionalPropertyTypes friendly
// =============================================================

import { isObject, toStr, toNum } from '@/integrations/types';

/* ----------------------------- domain types ----------------------------- */

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;

  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  country: string | null;
  postal_code: string | null;

  wallet_balance: number;

  created_at: string;
  updated_at: string;
};

export type ProfileUpsertInput = Partial<
  Pick<
    Profile,
    | 'full_name'
    | 'phone'
    | 'avatar_url'
    | 'address_line1'
    | 'address_line2'
    | 'city'
    | 'country'
    | 'postal_code'
  >
>;

export type GetMyProfileResponse = Profile | null;
export type UpsertMyProfileRequest = { profile: ProfileUpsertInput };
export type UpsertMyProfileResponse = Profile;

/* ----------------------------- internal helpers ----------------------------- */

type Obj = Record<string, unknown>;

const pickFirst = (src: Obj, keys: readonly string[]): unknown => {
  for (const k of keys) {
    const v = src[k];
    if (v != null) return v;
  }
  return undefined;
};

const pickOptStr = (src: Obj, keys: readonly string[]): string | null => {
  const s = toStr(pickFirst(src, keys)).trim();
  return s ? s : null;
};

const pickReqStr = (src: Obj, keys: readonly string[], fallback = ''): string => {
  const s = toStr(pickFirst(src, keys)).trim();
  return s ? s : fallback;
};

/* ----------------------------- normalizers ----------------------------- */

export function normalizeProfile(row: unknown): Profile {
  const r: Obj = isObject(row) ? (row as Obj) : {};

  const createdAt = pickReqStr(r, ['created_at', 'createdAt'], '');
  const updatedAt = pickReqStr(r, ['updated_at', 'updatedAt'], createdAt);

  return {
    id: pickReqStr(r, ['id'], ''),

    full_name: pickOptStr(r, ['full_name', 'fullName']),
    phone: pickOptStr(r, ['phone']),
    avatar_url: pickOptStr(r, ['avatar_url', 'avatarUrl']),

    address_line1: pickOptStr(r, ['address_line1', 'addressLine1']),
    address_line2: pickOptStr(r, ['address_line2', 'addressLine2']),
    city: pickOptStr(r, ['city']),
    country: pickOptStr(r, ['country']),
    postal_code: pickOptStr(r, ['postal_code', 'postalCode']),

    wallet_balance: toNum(pickFirst(r, ['wallet_balance', 'walletBalance']) ?? 0),

    created_at: createdAt,
    updated_at: updatedAt,
  };
}

export function normalizeMyProfileResponse(res: unknown): GetMyProfileResponse {
  if (res == null) return null;
  return normalizeProfile(res);
}

/* ----------------------------- body mappers ----------------------------- */

export function toUpsertMyProfileBody(input: ProfileUpsertInput): Record<string, unknown> {
  const p: Record<string, unknown> = {};

  if (typeof input.full_name !== 'undefined') p.full_name = input.full_name;
  if (typeof input.phone !== 'undefined') p.phone = input.phone;
  if (typeof input.avatar_url !== 'undefined') p.avatar_url = input.avatar_url;

  if (typeof input.address_line1 !== 'undefined') p.address_line1 = input.address_line1;
  if (typeof input.address_line2 !== 'undefined') p.address_line2 = input.address_line2;
  if (typeof input.city !== 'undefined') p.city = input.city;
  if (typeof input.country !== 'undefined') p.country = input.country;
  if (typeof input.postal_code !== 'undefined') p.postal_code = input.postal_code;

  return { profile: p };
}
