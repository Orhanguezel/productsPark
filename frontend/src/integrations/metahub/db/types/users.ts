// =============================================================
// FILE: src/integrations/metahub/db/types/users.ts
// =============================================================

export type ProfileRow = {
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
  created_at: string; // ISO
  updated_at: string; // ISO
};

export type UserRoleRow = {
  id: string;
  user_id: string;
  role: "admin" | "moderator" | "user";
  created_at?: string;
};
