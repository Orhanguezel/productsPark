// =============================================================
// FILE: src/integrations/rtk/admin/contacts_admin.endpoints.ts
// FINAL — Admin Contacts RTK Endpoints (central types, no metahub)
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type { ContactView, ContactListParams, ContactUpdateInput } from '@/integrations/types';
import { buildContactsAdminListQuery } from '@/integrations/types';

const BASE = '/admin/contacts';

export const contactsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /admin/contacts
    listContactsAdmin: b.query<ContactView[], ContactListParams | void>({
      query: (params) => {
        const qs = buildContactsAdminListQuery(params ?? undefined);
        return { url: `${BASE}${qs}`, method: 'GET' };
      },
      providesTags: (res) =>
        res?.length
          ? [
              { type: 'Contacts' as const, id: 'LIST' },
              ...res.map((r) => ({ type: 'Contacts' as const, id: r.id })),
            ]
          : [{ type: 'Contacts' as const, id: 'LIST' }],
    }),

    // GET /admin/contacts/:id
    getContactAdmin: b.query<ContactView, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}`, method: 'GET' }),
      providesTags: (_res, _e, id) => [{ type: 'Contacts' as const, id }],
    }),

    // PATCH /admin/contacts/:id
    updateContactAdmin: b.mutation<ContactView, { id: string; patch: ContactUpdateInput }>({
      query: ({ id, patch }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (res, _e, arg) =>
        res?.id
          ? [
              { type: 'Contacts' as const, id: res.id },
              { type: 'Contacts' as const, id: 'LIST' },
            ]
          : [
              { type: 'Contacts' as const, id: arg.id },
              { type: 'Contacts' as const, id: 'LIST' },
            ],
    }),

    // DELETE /admin/contacts/:id
    removeContactAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: (_res, _e, id) => [
        { type: 'Contacts' as const, id },
        { type: 'Contacts' as const, id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListContactsAdminQuery,
  useGetContactAdminQuery,
  useUpdateContactAdminMutation,
  useRemoveContactAdminMutation,
} = contactsAdminApi;
