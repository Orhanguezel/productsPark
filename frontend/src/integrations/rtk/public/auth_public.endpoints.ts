// =============================================================
// FILE: src/integrations/rtk/public/auth_public.endpoints.ts
// FINAL — Public Auth RTK Endpoints (central types, BASE constant)
// - Hook aliases: useLoginMutation/useSignupMutation/useStatusQuery/useOauthStartMutation
// - strict/no-any
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  AuthTokenResponse,
  AuthStatusResponse,
  AuthMeResponse,
  PasswordResetRequestResponse,
  PasswordResetConfirmResponse,
  AuthTokenRefreshResponse,
  AuthSignupBody,
  AuthTokenBody,
  AuthUpdateBody,
  PasswordResetRequestBody,
  PasswordResetConfirmBody,
} from '@/integrations/types';

const BASE = '/auth';

type OauthStartResp = { url: string | null };

const extendedApi = baseApi.enhanceEndpoints({
  addTagTypes: ['User', 'AdminUsers', 'UserRoles'] as const,
});

export const authPublicApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    authSignup: b.mutation<AuthTokenResponse, AuthSignupBody>({
      query: (body) => ({ url: `${BASE}/signup`, method: 'POST', body }),
      invalidatesTags: [{ type: 'User', id: 'ME' }],
    }),

    authToken: b.mutation<AuthTokenResponse, AuthTokenBody>({
      query: (body) => ({ url: `${BASE}/token`, method: 'POST', body }),
      invalidatesTags: [{ type: 'User', id: 'ME' }],
    }),

    authRefresh: b.mutation<AuthTokenRefreshResponse, void>({
      query: () => ({ url: `${BASE}/token/refresh`, method: 'POST' }),
      invalidatesTags: [{ type: 'User', id: 'ME' }],
    }),

    authMe: b.query<AuthMeResponse, void>({
      query: () => ({ url: `${BASE}/user`, method: 'GET' }),
      providesTags: [{ type: 'User', id: 'ME' }],
    }),

    authStatus: b.query<AuthStatusResponse, void>({
      query: () => ({ url: `${BASE}/status`, method: 'GET' }),
      providesTags: [{ type: 'User', id: 'ME' }],
    }),

    authUpdate: b.mutation<AuthMeResponse, AuthUpdateBody>({
      query: (body) => ({ url: `${BASE}/user`, method: 'PUT', body }),
      invalidatesTags: [{ type: 'User', id: 'ME' }],
    }),

    authPasswordResetRequest: b.mutation<PasswordResetRequestResponse, PasswordResetRequestBody>({
      query: (body) => ({ url: `${BASE}/password-reset/request`, method: 'POST', body }),
      transformResponse: (): PasswordResetRequestResponse => ({ ok: true }),
    }),

    authPasswordResetConfirm: b.mutation<PasswordResetConfirmResponse, PasswordResetConfirmBody>({
      query: (body) => ({ url: `${BASE}/password-reset/confirm`, method: 'POST', body }),
      transformResponse: (): PasswordResetConfirmResponse => ({ ok: true }),
    }),

    authLogout: b.mutation<{ ok: true }, void>({
      query: () => ({ url: `${BASE}/logout`, method: 'POST' }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: [
        { type: 'User', id: 'ME' },
        { type: 'AdminUsers', id: 'LIST' },
        { type: 'UserRoles', id: 'LIST' },
      ],
    }),

    oauthStart: b.mutation<OauthStartResp, { redirectTo: string }>({
      query: (body) => ({ url: `${BASE}/oauth/google/start`, method: 'POST', body }),
    }),
  }),
  overrideExisting: true,
});

export const {
  useAuthSignupMutation,
  useAuthTokenMutation,
  useAuthRefreshMutation,
  useAuthMeQuery,
  useAuthStatusQuery,
  useAuthUpdateMutation,
  useAuthPasswordResetRequestMutation,
  useAuthPasswordResetConfirmMutation,
  useAuthLogoutMutation,
  useOauthStartMutation,
} = authPublicApi;

// Aliases
export const useSignupMutation = useAuthSignupMutation;
export const useLoginMutation = useAuthTokenMutation;
export const useStatusQuery = useAuthStatusQuery;
