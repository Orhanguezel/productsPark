// =============================================================
// FILE: src/integrations/types/auth.ts
// FINAL — Public Auth types (central types barrel)
// =============================================================

export type AuthUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  roles?: string[]; // BE ne döndürüyorsa; UI isterse normalize ederiz
  is_active?: boolean;
};

export type AuthTokenResponse = {
  access_token: string;
  token_type?: string; // optional
  expires_in?: number; // optional
  user?: AuthUser | null; // optional
};

export type AuthTokenRefreshResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
};

export type AuthMeResponse = AuthUser | null;

export type AuthStatusResponse = {
  authenticated: boolean;
  user?: AuthUser | null;
};

export type PasswordResetRequestResponse = {
  ok: true;
  message?: string;
};

export type PasswordResetConfirmResponse = {
  ok: true;
  message?: string;
};

export type AuthSignupBody = {
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
};

export type AuthTokenBody = {
  grant_type: 'password';
  email: string;
  password: string;
};

export type AuthUpdateBody = {
  full_name?: string | null;
  phone?: string | null;
  password?: string;
  email?: string | null;
};

export type PasswordResetRequestBody = {
  email: string;
};

export type PasswordResetConfirmBody = {
  token: string;
  password: string;
};
