// =============================================================
// FILE: src/integrations/metahub/db/types/users.ts
// =============================================================

export type UserRoleName = "admin" | "moderator" | "user";
export type UserRole = {
  id: string;
  name: UserRoleName;
  description?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type UserMetadata = {
  full_name?: string | null;
  name?: string | null;
  [k: string]: unknown;
} | null;

export type ProfileRow = {
  id: string;
  email?: string | null;
  is_active?: boolean | 0 | 1 | "0" | "1" | null;

  full_name: string | null;
  phone?: string | null;
  avatar_url?: string | null;

  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  country?: string | null;
  postal_code?: string | null;

  wallet_balance?: number | string | null;

  created_at: string;
  updated_at?: string | null;
};

export type UserRoleRow = {
  id: string;
  user_id: string;
  role: UserRoleName;
  created_at?: string | null;
};

/** Admin API ham cevabını kapsayan raw tip (role veya roles gelebilir) */
export type AdminUserRaw = {
  id: string;
  email: string | null;
  full_name?: string | null;
  created_at?: string | null;
  role?: UserRoleName | string | null;
  roles?: Array<UserRoleName | string> | string | null;
};

/** Normalize edilmiş admin user görünümü (UI bundan beslenecek) */
export type AdminUserView = {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string | null;
  roles: UserRoleName[]; // her zaman dizi
};

export type User = {
  id: string;
  email: string;
  full_name?: string | null;
  phone?: string | null;
  is_active?: 0 | 1;
  email_verified?: 0 | 1;
  wallet_balance?: string; // backend decimal as string
  last_sign_in_at?: string | null; // ISO
  created_at?: string;
  updated_at?: string;
  role?: UserRole;
  [key: string]: unknown;
  user_metadata?: UserMetadata;
};
