// src/integrations/metahub/rtk/endpoints/auth.endpoints.ts
import { baseApi } from "../baseApi";
import type { FetchArgs } from "@reduxjs/toolkit/query";
import type { User } from "@/integrations/metahub/core/types";

/* -----------------------------
 * Request/Response Types
 * ----------------------------- */
type LoginBody = { grant_type: "password"; email: string; password: string };

type SignUpBody = {
  email: string;
  password: string;
  options?: { emailRedirectTo?: string; data?: Record<string, unknown> };
};

export type TokenResp = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: "bearer";
  user: User;
};

export type UserResp = { user: User };

export type StatusResp = {
  authenticated: boolean;
  is_admin: boolean;
  user?: { id: string; email: string | null; role: "admin" | "moderator" | "user" };
};

/* -----------------------------
 * Public/Auth Endpoints
 * ----------------------------- */
export const authApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    token: b.mutation<TokenResp, { email: string; password: string }>({
      query: ({ email, password }): FetchArgs => ({
        url: "/auth/v1/token",
        method: "POST",
        body: { grant_type: "password", email, password } satisfies LoginBody,
      }),
      invalidatesTags: ["Auth", "User"],
    }),

    signUp: b.mutation<TokenResp, SignUpBody>({
      query: (body): FetchArgs => ({
        url: "/auth/v1/signup",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth", "User"],
    }),

    refresh: b.mutation<{ access_token: string; token_type: "bearer" }, void>({
      query: (): FetchArgs => ({ url: "/auth/v1/token/refresh", method: "POST" }),
      invalidatesTags: ["Auth"],
    }),

    me: b.query<UserResp, void>({
      query: (): FetchArgs => ({ url: "/auth/v1/user", method: "GET" }),
      providesTags: ["Auth", "User"],
    }),

    status: b.query<StatusResp, void>({
      query: (): FetchArgs => ({ url: "/auth/v1/status", method: "GET" }),
      providesTags: ["Auth", "User"],
    }),

    logout: b.mutation<void, void>({
      query: (): FetchArgs => ({ url: "/auth/v1/logout", method: "POST" }),
      invalidatesTags: ["Auth", "User"],
    }),

    signInWithGoogle: b.mutation<TokenResp, { idToken: string }>({
      query: ({ idToken }): FetchArgs => ({
        url: "/auth/v1/google",
        method: "POST",
        body: { id_token: idToken },
      }),
      invalidatesTags: ["Auth", "User"],
    }),

    googleStart: b.mutation<{ url: string }, { redirectTo?: string }>({
      query: ({ redirectTo }): FetchArgs => ({
        url: "/auth/v1/google/start",
        method: "POST",
        body: { redirectTo },
      }),
    }),

    updateUser: b.mutation<UserResp, Partial<User> & { password?: string }>({
      query: (body): FetchArgs => ({
        url: "/auth/v1/user",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["User", "Auth"],
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
} = authApi;

export const useLoginMutation = useTokenMutation;
export const useSignupMutation = useSignUpMutation;
export const useGetSessionQuery = useMeQuery;
export const useOauthStartMutation = useGoogleStartMutation;
