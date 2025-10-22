// Drizzle şemanı camelCase + güvenli string tarih/decimal olarak modelliyoruz

export type UserRole = "admin" | "moderator" | "user";
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
  role?: "admin" | "moderator" | "user"; // opsiyonel
  [key: string]: unknown;
};

export type Session = {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;   // seconds
  tokenType?: "bearer";
  user: User;
};

export type ResultError = { message: string; status?: number; raw?: unknown };
export type FetchResult<T = unknown> = { data: T | null; error: ResultError | null };
