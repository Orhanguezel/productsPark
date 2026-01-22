// =============================================================
// FILE: src/integrations/rtk/public/contacts_public.endpoints.ts
// FINAL — Public Contacts RTK Endpoints (central types)
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type { ContactCreateInput, CreateContactPublicResponse } from '@/integrations/types';

const BASE = '/contacts';

export const contactsPublicApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /** POST /contacts (public, honeypot'lu) */
    createContact: b.mutation<CreateContactPublicResponse, ContactCreateInput>({
      query: (body) => ({
        url: BASE,
        method: 'POST',
        body,
        headers: { 'x-skip-auth': '1' },
      }),
      invalidatesTags: [{ type: 'Contacts' as const, id: 'LIST' }],
    }),
  }),
  overrideExisting: true,
});

export const { useCreateContactMutation } = contactsPublicApi;
