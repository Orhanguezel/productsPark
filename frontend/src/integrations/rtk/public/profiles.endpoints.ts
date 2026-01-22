// =============================================================
// FILE: src/integrations/rtk/profiles.endpoints.ts
// FINAL — Profiles RTK Endpoints (robust unwrap)
// - getMyProfile: unwrap {data}/{profile}/{user} and normalizeProfile()
// - avoids "empty profile" due to shape mismatch
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type { FetchArgs } from '@reduxjs/toolkit/query';

import type {
  GetMyProfileResponse,
  UpsertMyProfileResponse,
  ProfileUpsertInput,
} from '@/integrations/types';

import { normalizeProfile, toUpsertMyProfileBody, isPlainObject } from '@/integrations/types';

const BASE = '/profiles/me';

const extendedApi = baseApi.enhanceEndpoints({
  addTagTypes: ['Profile'] as const,
});

function unwrapProfilePayload(res: unknown): unknown {
  // Already an object profile?
  if (!isPlainObject(res)) return res;

  const o = res as Record<string, unknown>;

  // Common wrappers
  const candidates: unknown[] = [o.data, o.profile, o.user, o.result, o.item];

  for (const c of candidates) {
    if (isPlainObject(c)) return c;
  }

  // Some APIs return array with one item
  if (Array.isArray(o.data) && o.data[0] && isPlainObject(o.data[0])) return o.data[0];

  // Fallback: maybe it's already the profile object
  return res;
}

export const profilesApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    getMyProfile: b.query<GetMyProfileResponse, void>({
      query: (): FetchArgs => ({ url: BASE, method: 'GET' }),

      // ✅ robust: unwrap then normalize
      transformResponse: (res: unknown): GetMyProfileResponse => {
        const unwrapped = unwrapProfilePayload(res);
        // normalizeProfile is already your canonical normalizer
        return normalizeProfile(unwrapped) as unknown as GetMyProfileResponse;
      },

      providesTags: [{ type: 'Profile', id: 'ME' }],
      keepUnusedDataFor: 60,
    }),

    upsertMyProfile: b.mutation<UpsertMyProfileResponse, ProfileUpsertInput>({
      query: (input): FetchArgs => ({
        url: BASE,
        method: 'PUT',
        body: toUpsertMyProfileBody(input),
      }),

      transformResponse: (res: unknown): UpsertMyProfileResponse => {
        const unwrapped = unwrapProfilePayload(res);
        return normalizeProfile(unwrapped) as UpsertMyProfileResponse;
      },

      invalidatesTags: [{ type: 'Profile', id: 'ME' }],
    }),
  }),
  overrideExisting: true,
});

export const { useGetMyProfileQuery, useUpsertMyProfileMutation } = profilesApi;
