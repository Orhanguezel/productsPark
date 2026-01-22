// =============================================================
// FILE: src/integrations/rtk/profiles.endpoints.ts
// FINAL — Profiles RTK Endpoints (clean)
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type { FetchArgs } from '@reduxjs/toolkit/query';

import type {
  GetMyProfileResponse,
  UpsertMyProfileResponse,
  ProfileUpsertInput,
} from '@/integrations/types';

import {
  normalizeMyProfileResponse,
  normalizeProfile,
  toUpsertMyProfileBody,
} from '@/integrations/types';

const BASE = '/profiles/me';

const extendedApi = baseApi.enhanceEndpoints({
  addTagTypes: ['Profile'] as const,
});

export const profilesApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    getMyProfile: b.query<GetMyProfileResponse, void>({
      query: (): FetchArgs => ({ url: BASE, method: 'GET' }),
      transformResponse: (res: unknown): GetMyProfileResponse => normalizeMyProfileResponse(res),
      providesTags: [{ type: 'Profile', id: 'ME' }],
      keepUnusedDataFor: 60,
    }),

    upsertMyProfile: b.mutation<UpsertMyProfileResponse, ProfileUpsertInput>({
      query: (input): FetchArgs => ({
        url: BASE,
        method: 'PUT',
        body: toUpsertMyProfileBody(input),
      }),
      transformResponse: (res: unknown): UpsertMyProfileResponse => normalizeProfile(res),
      invalidatesTags: [{ type: 'Profile', id: 'ME' }],
    }),
  }),
  overrideExisting: true,
});

export const { useGetMyProfileQuery, useUpsertMyProfileMutation } = profilesApi;
