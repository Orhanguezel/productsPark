// =============================================================
// FILE: src/integrations/rtk/user_roles.endpoints.ts
// FINAL — User Roles RTK Endpoints (tagTypes fixed)
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type { UserRole, UserRoleName } from '@/integrations/types';

const BASE = '/user_roles';

export type UserRolesListParams = {
  user_id?: string;
  role?: UserRoleName;
  order?: 'created_at';
  direction?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
};

const extendedApi = baseApi.enhanceEndpoints({
  addTagTypes: ['UserRole', 'UserRoles'] as const,
});

export const userRolesApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    listUserRoles: b.query<UserRole[], UserRolesListParams | undefined>({
      query: (params) => {
        const sp = new URLSearchParams();
        if (params?.user_id) sp.set('user_id', params.user_id);
        if (params?.role) sp.set('role', params.role);

        sp.set('order', params?.order ?? 'created_at');
        sp.set('direction', params?.direction ?? 'asc');

        if (typeof params?.limit === 'number') sp.set('limit', String(params!.limit));
        if (typeof params?.offset === 'number') sp.set('offset', String(params!.offset));

        const qs = sp.toString();
        return { url: qs ? `${BASE}?${qs}` : BASE, method: 'GET' };
      },
      transformResponse: (res: unknown): UserRole[] =>
        Array.isArray(res) ? (res as UserRole[]) : [],
      providesTags: (result) =>
        result?.length
          ? [
              ...result.map((r) => ({ type: 'UserRole' as const, id: r.id })),
              { type: 'UserRoles' as const, id: 'LIST' },
            ]
          : [{ type: 'UserRoles' as const, id: 'LIST' }],
      keepUnusedDataFor: 10,
    }),
  }),
  overrideExisting: true,
});

export const { useListUserRolesQuery } = userRolesApi;
