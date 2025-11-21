// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/contacts.endpoints.ts
// -------------------------------------------------------------
import { baseApi } from "../baseApi";
import type {
  ContactView,
  ContactCreateInput,
  CreateContactPublicResponse,
} from "@/integrations/metahub/rtk/types/contacts";

export const contactsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /** POST /contacts (public, honeypot'lu) */
    createContact: b.mutation<CreateContactPublicResponse, ContactCreateInput>({
      query: (body) => ({
        url: "/contacts",
        method: "POST",
        body,
        headers: { "x-skip-auth": "1" },
      }),
      // Admin tarafında bir liste ekranı eklersen kullanılacak
      invalidatesTags: [{ type: "Contacts" as const, id: "LIST" }],
    }),
  }),
  overrideExisting: true,
});

export const { useCreateContactMutation } = contactsApi;
export type { ContactView };
