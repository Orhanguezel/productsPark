// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/admin/roles_admin.endpoints.ts
// FINAL — Roles Admin RTK (no helpers/normalizers here)
// -------------------------------------------------------------

import { baseApi } from '@/integrations/baseApi';

import type {
  Permission,
  Role,
  RolesListParams,
  UpsertRoleBody,
  PatchRoleBody,
} from '@/integrations/types';

import {
  normalizeRole,
  normalizeRoles,
  normalizePermissions,
  toRolesAdminListQuery,
} from '@/integrations/types';

export const rolesAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listRolesAdmin: b.query<Role[], RolesListParams | void>({
      query: (p) => {
        const params = toRolesAdminListQuery(p);
        return params ? { url: '/admin/roles', params } : { url: '/admin/roles' };
      },
      transformResponse: (res: unknown): Role[] => normalizeRoles(res),
      providesTags: (result) =>
        result?.length
          ? [
              ...result.map((r) => ({ type: 'Role' as const, id: r.slug })),
              { type: 'Roles' as const, id: 'LIST' },
            ]
          : [{ type: 'Roles' as const, id: 'LIST' }],
    }),

    getRoleAdmin: b.query<Role, string>({
      query: (slug) => ({ url: `/admin/roles/${encodeURIComponent(slug)}` }),
      transformResponse: (res: unknown): Role => normalizeRole(res),
      providesTags: (_r, _e, slug) => [{ type: 'Role' as const, id: slug }],
    }),

    createRoleAdmin: b.mutation<Role, UpsertRoleBody>({
      query: (body) => ({ url: '/admin/roles', method: 'POST', body }),
      transformResponse: (res: unknown): Role => normalizeRole(res),
      invalidatesTags: [{ type: 'Roles' as const, id: 'LIST' }],
    }),

    updateRoleAdmin: b.mutation<Role, { slug: string; body: PatchRoleBody }>({
      query: ({ slug, body }) => ({
        url: `/admin/roles/${encodeURIComponent(slug)}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: unknown): Role => normalizeRole(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Role' as const, id: arg.slug },
        { type: 'Roles' as const, id: 'LIST' },
      ],
    }),

    deleteRoleAdmin: b.mutation<{ ok: true }, string>({
      query: (slug) => ({ url: `/admin/roles/${encodeURIComponent(slug)}`, method: 'DELETE' }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: [{ type: 'Roles' as const, id: 'LIST' }],
    }),

    listPermissionsAdmin: b.query<Permission[], void>({
      query: () => ({ url: '/admin/permissions' }),
      transformResponse: (res: unknown): Permission[] => normalizePermissions(res),
      providesTags: [{ type: 'Permissions' as const, id: 'LIST' }],
    }),

    setRolePermissionsAdmin: b.mutation<{ ok: true }, { slug: string; permissions: string[] }>({
      query: ({ slug, permissions }) => ({
        url: `/admin/roles/${encodeURIComponent(slug)}/permissions`,
        method: 'POST',
        body: { permissions },
      }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Role' as const, id: arg.slug },
        { type: 'Roles' as const, id: 'LIST' },
        { type: 'Permissions' as const, id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListRolesAdminQuery,
  useGetRoleAdminQuery,
  useCreateRoleAdminMutation,
  useUpdateRoleAdminMutation,
  useDeleteRoleAdminMutation,
  useListPermissionsAdminQuery,
  useSetRolePermissionsAdminMutation,
} = rolesAdminApi;
