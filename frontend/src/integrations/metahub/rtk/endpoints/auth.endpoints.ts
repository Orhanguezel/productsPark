import { baseApi } from "../baseApi";
import type { User } from "@/integrations/metahub/core/types";

type LoginBody = { grant_type: "password"; email: string; password: string };
type SignUpBody = {
  email: string;
  password: string;
  options?: { emailRedirectTo?: string; data?: Record<string, unknown> };
};

type TokenResp = {
  access_token: string;
  refresh_token?: string; // cookie tabanlı, opsiyonel
  expires_in?: number;
  token_type?: "bearer";
  user: User;
};

type UserResp = { user: User };

type StatusResp = {
  authenticated: boolean;
  is_admin: boolean;
  user?: { id: string; email: string | null; role: "admin" | "moderator" | "user" };
};

export const authApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    token: b.mutation<TokenResp, { email: string; password: string }>({
      query: ({ email, password }) => ({
        url: "/auth/v1/token",
        method: "POST",
        body: { grant_type: "password", email, password } satisfies LoginBody,
      }),
      invalidatesTags: ["Auth", "User"],
    }),

    signUp: b.mutation<UserResp, SignUpBody>({
      query: (body) => ({ url: "/auth/v1/signup", method: "POST", body }),
      invalidatesTags: ["Auth", "User"],
    }),

    me: b.query<UserResp, void>({
      query: () => ({ url: "/auth/v1/user", method: "GET" }),
      providesTags: ["Auth", "User"],
    }),

    /** FE Navbar için sade kontrol: { authenticated, is_admin, user? } */
    status: b.query<StatusResp, void>({
      query: () => ({ url: "/auth/v1/status", method: "GET" }),
      providesTags: ["Auth", "User"],
    }),

    logout: b.mutation<void, void>({
      query: () => ({ url: "/auth/v1/logout", method: "POST" }),
      invalidatesTags: ["Auth", "User"],
    }),

    // Google (ID Token ile)
    signInWithGoogle: b.mutation<TokenResp, { idToken: string }>({
      query: ({ idToken }) => ({
        url: "/auth/v1/google",
        method: "POST",
        body: { id_token: idToken },
      }),
      invalidatesTags: ["Auth", "User"],
    }),

    // Google redirect başlat
    googleStart: b.mutation<{ url: string }, { redirectTo?: string }>({
      query: ({ redirectTo }) => ({
        url: "/auth/v1/google/start",
        method: "POST",
        body: { redirectTo },
      }),
    }),

    updateUser: b.mutation<UserResp, Partial<User> & { password?: string }>({
      query: (body) => ({ url: "/auth/v1/user", method: "PUT", body }),
      invalidatesTags: ["User"],
    }),

    // ---- Refresh (isteğe bağlı elde çağırmak için) ----
    refresh: b.mutation<{ access_token: string; token_type: "bearer" }, void>({
      query: () => ({ url: "/auth/v1/token/refresh", method: "POST" }),
      invalidatesTags: ["Auth"],
    }),

    // ---- Password Reset ----
    resetRequest: b.mutation<{ ok: true }, { email: string; redirectTo?: string }>({
      query: ({ email, redirectTo }) => ({
        url: "/auth/v1/password/reset/request",
        method: "POST",
        body: { email, redirectTo },
      }),
    }),

    resetConfirm: b.mutation<{ ok: true }, { token: string; new_password: string }>({
      query: ({ token, new_password }) => ({
        url: "/auth/v1/password/reset/confirm",
        method: "POST",
        body: { token, new_password },
      }),
      invalidatesTags: ["Auth", "User"],
    }),
  }),
});

export const {
  useTokenMutation,
  useSignUpMutation,
  useMeQuery,
  useStatusQuery,              // ⬅️ yeni
  useLogoutMutation,
  useSignInWithGoogleMutation,
  useUpdateUserMutation,
  useGoogleStartMutation,
  useRefreshMutation,
  useResetRequestMutation,
  useResetConfirmMutation,
} = authApi;

// Eski isimlerle alias (UI uyumu)
export const useLoginMutation = useTokenMutation;
export const useSignupMutation = useSignUpMutation;
export const useGetSessionQuery = useMeQuery;
export const useOauthStartMutation = useGoogleStartMutation;
