// ===================================================================
// FILE: src/integrations/rtk/admin/auth_admin.endpoints.ts
// FINAL — Admin Users + Auth role endpoints (types+normalizers central)
// ===================================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  AdminUserView,
  AdminUsersListParams,
  AdminUpdateUserBody,
  AdminSetActiveBody,
  AdminSetRolesBody,
  AdminSetPasswordBody,
  AdminRemoveUserBody,
  AdminRoleByUserOrEmailBody,
  AdminMakeByEmailBody,
} from '@/integrations/types';
import { normalizeAdminUser } from '@/integrations/types';

const BASE = '/admin/users';



export const authAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /** GET /admin/users */
    adminList: b.query<AdminUserView[], AdminUsersListParams | void>({
      query: (params) => {
        const p = params ?? {};
        const sp = new URLSearchParams();

        if (p.q) sp.set('q', p.q);
        if (p.role) sp.set('role', p.role);
        if (typeof p.is_active === 'boolean') sp.set('is_active', p.is_active ? '1' : '0');
        if (p.limit != null) sp.set('limit', String(p.limit));
        if (p.offset != null) sp.set('offset', String(p.offset));
        if (p.sort) sp.set('sort', p.sort);
        if (p.order) sp.set('order', p.order);

        const qs = sp.toString();
        return { url: qs ? `${BASE}?${qs}` : BASE, method: 'GET' };
      },
      transformResponse: (res: unknown): AdminUserView[] =>
        Array.isArray(res) ? res.map(normalizeAdminUser) : [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((u) => ({ type: 'AdminUsers' as const, id: u.id })),
              { type: 'AdminUsers' as const, id: 'LIST' },
            ]
          : [{ type: 'AdminUsers' as const, id: 'LIST' }],
    }),

    /** GET /admin/users/:id */
    adminGet: b.query<AdminUserView, { id: string }>({
      query: ({ id }) => ({ url: `${BASE}/${encodeURIComponent(id)}`, method: 'GET' }),
      transformResponse: (res: unknown): AdminUserView => normalizeAdminUser(res),
      providesTags: (_r, _e, arg) => [{ type: 'AdminUsers', id: arg.id }],
    }),

    /** PATCH /admin/users/:id */
    adminUpdateUser: b.mutation<AdminUserView, AdminUpdateUserBody>({
      query: ({ id, ...patch }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: patch,
      }),
      transformResponse: (res: unknown): AdminUserView => normalizeAdminUser(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'AdminUsers', id: arg.id },
        { type: 'AdminUsers', id: 'LIST' },
      ],
    }),

    /** POST /admin/users/:id/active */
    adminSetActive: b.mutation<{ ok: true }, AdminSetActiveBody>({
      query: ({ id, is_active }) => ({
        url: `${BASE}/${encodeURIComponent(id)}/active`,
        method: 'POST',
        body: { is_active },
      }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'AdminUsers', id: arg.id },
        { type: 'AdminUsers', id: 'LIST' },
      ],
    }),

    /** POST /admin/users/:id/roles */
    adminSetRoles: b.mutation<{ ok: true }, AdminSetRolesBody>({
      query: ({ id, roles }) => ({
        url: `${BASE}/${encodeURIComponent(id)}/roles`,
        method: 'POST',
        body: { roles },
      }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'AdminUsers', id: arg.id },
        { type: 'AdminUsers', id: 'LIST' },
        { type: 'UserRoles' as const, id: 'LIST' },
      ],
    }),

    /** POST /admin/users/:id/password */
    adminSetPassword: b.mutation<{ ok: true }, AdminSetPasswordBody>({
      query: ({ id, password }) => ({
        url: `${BASE}/${encodeURIComponent(id)}/password`,
        method: 'POST',
        body: { password },
      }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'AdminUsers', id: arg.id },
        { type: 'AdminUsers', id: 'LIST' },
      ],
    }),

    /** DELETE /admin/users/:id */
    adminRemoveUser: b.mutation<{ ok: true }, AdminRemoveUserBody>({
      query: ({ id }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'AdminUsers', id: arg.id },
        { type: 'AdminUsers', id: 'LIST' },
      ],
    }),

    /** POST /auth/admin/roles */
    adminGrantRole: b.mutation<{ ok: true }, AdminRoleByUserOrEmailBody>({
      query: (body) => ({ url: '/auth/admin/roles', method: 'POST', body }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: [
        { type: 'UserRoles' as const, id: 'LIST' },
        { type: 'AdminUsers' as const, id: 'LIST' },
      ],
    }),

    /** DELETE /auth/admin/roles */
    adminRevokeRole: b.mutation<{ ok: true }, AdminRoleByUserOrEmailBody>({
      query: (body) => ({ url: '/auth/admin/roles', method: 'DELETE', body }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: [
        { type: 'UserRoles' as const, id: 'LIST' },
        { type: 'AdminUsers' as const, id: 'LIST' },
      ],
    }),

    /** POST /auth/admin/make-admin */
    adminMakeByEmail: b.mutation<{ ok: true }, AdminMakeByEmailBody>({
      query: (body) => ({ url: '/auth/admin/make-admin', method: 'POST', body }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: [
        { type: 'UserRoles' as const, id: 'LIST' },
        { type: 'AdminUsers' as const, id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useAdminListQuery,
  useAdminGetQuery,
  useAdminUpdateUserMutation,
  useAdminSetActiveMutation,
  useAdminSetRolesMutation,
  useAdminSetPasswordMutation,
  useAdminRemoveUserMutation,
  useAdminGrantRoleMutation,
  useAdminRevokeRoleMutation,
  useAdminMakeByEmailMutation,
} = authAdminApi;
