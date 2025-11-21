// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/auth.endpoints.ts
// =============================================================
import { baseApi } from "../baseApi";
import type { FetchArgs } from "@reduxjs/toolkit/query";
import type { User } from "@/integrations/metahub/core/types";

/* -----------------------------
 * Request/Response Types
 * ----------------------------- */

type LoginBody = {
  grant_type: "password";
  email: string;
  password: string;
};

type SignUpBody = {
  email: string;
  password: string;
  options?: {
    emailRedirectTo?: string;
    data?: Record<string, unknown>;
  };
};

export type TokenResp = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: "bearer";
  user: User;
};

export type UserResp = {
  user: User;
};

export type StatusResp = {
  authenticated: boolean;
  is_admin: boolean;
  user?: {
    id: string;
    email: string | null;
    role: "admin" | "moderator" | "user";
  };
};

/* -----------------------------
 * Password reset types
 * ----------------------------- */

export type PasswordResetRequestBody = {
  email: string;
};

export type PasswordResetRequestResp = {
  success: boolean;
  token?: string;      // ⬅️ FE'de resp.token okuyorsun, burada tanımlı olmalı
  message?: string;
  error?: string;
};

export type PasswordResetConfirmBody = {
  token: string;
  password: string;
};

export type PasswordResetConfirmResp = {
  success: boolean;
  message?: string;
  error?: string;
};

const BASE = "/auth";

/* -----------------------------
 * Public/Auth Endpoints
 * ----------------------------- */

export const authApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /** POST /auth/token  (password grant) */
    token: b.mutation<TokenResp, { email: string; password: string }>({
      query: ({ email, password }): FetchArgs => ({
        url: `${BASE}/token`,
        method: "POST",
        body: {
          grant_type: "password",
          email,
          password,
        } satisfies LoginBody,
      }),
      invalidatesTags: ["Auth", "User"],
    }),

    /** POST /auth/signup */
    signUp: b.mutation<TokenResp, SignUpBody>({
      query: (body): FetchArgs => ({
        url: `${BASE}/signup`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth", "User"],
    }),

    /** POST /auth/token/refresh */
    refresh: b.mutation<
      { access_token: string; token_type: "bearer" },
      void
    >({
      query: (): FetchArgs => ({
        url: `${BASE}/token/refresh`,
        method: "POST",
      }),
      invalidatesTags: ["Auth"],
    }),

    /** GET /auth/user (me) */
    me: b.query<UserResp, void>({
      query: (): FetchArgs => ({
        url: `${BASE}/user`,
        method: "GET",
      }),
      providesTags: ["Auth", "User"],
    }),

    /** GET /auth/status */
    status: b.query<StatusResp, void>({
      query: (): FetchArgs => ({
        url: `${BASE}/status`,
        method: "GET",
      }),
      providesTags: ["Auth", "User"],
    }),

    /** POST /auth/logout */
    logout: b.mutation<void, void>({
      query: (): FetchArgs => ({
        url: `${BASE}/logout`,
        method: "POST",
      }),
      invalidatesTags: ["Auth", "User"],
    }),

    /** POST /auth/google  (id token ile sign in) */
    signInWithGoogle: b.mutation<TokenResp, { idToken: string }>({
      query: ({ idToken }): FetchArgs => ({
        url: `${BASE}/google`,
        method: "POST",
        body: { id_token: idToken },
      }),
      invalidatesTags: ["Auth", "User"],
    }),

    /** POST /auth/google/start (redirect url üretimi) */
    googleStart: b.mutation<{ url: string }, { redirectTo?: string }>({
      query: ({ redirectTo }): FetchArgs => ({
        url: `${BASE}/google/start`,
        method: "POST",
        body: { redirectTo },
      }),
    }),

    /** PUT /auth/user  (profil + şifre güncelleme) */
    updateUser: b.mutation<UserResp, Partial<User> & { password?: string }>(
      {
        query: (body): FetchArgs => ({
          url: `${BASE}/user`,
          method: "PUT",
          body,
        }),
        invalidatesTags: ["User", "Auth"],
      }
    ),

    /** POST /auth/password-reset/request  (şifremi unuttum) */
    requestPasswordReset: b.mutation<
      PasswordResetRequestResp,
      PasswordResetRequestBody
    >({
      query: (body): FetchArgs => ({
        url: `${BASE}/password-reset/request`,
        method: "POST",
        body,
      }),
    }),

    /** POST /auth/password-reset/confirm  (yeni şifre kaydet) */
    confirmPasswordReset: b.mutation<
      PasswordResetConfirmResp,
      PasswordResetConfirmBody
    >({
      query: (body): FetchArgs => ({
        url: `${BASE}/password-reset/confirm`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth", "User"],
    }),
  }),
  overrideExisting: true,
});

export const {
  useTokenMutation,
  useSignUpMutation,
  useRefreshMutation,
  useMeQuery,
  useStatusQuery,
  useLogoutMutation,
  useSignInWithGoogleMutation,
  useGoogleStartMutation,
  useUpdateUserMutation,
  useRequestPasswordResetMutation,
  useConfirmPasswordResetMutation,
} = authApi;

// Kısa alias’lar
export const useLoginMutation = useTokenMutation;
export const useSignupMutation = useSignUpMutation;
export const useGetSessionQuery = useMeQuery;
export const useOauthStartMutation = useGoogleStartMutation;
