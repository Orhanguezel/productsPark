
// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/uploads.endpoints.ts
// -------------------------------------------------------------
import { baseApi as baseApi3 } from "../baseApi";

export type SignPutBody = { filename: string; content_type: string; folder?: string };
export type SignPutResp = { upload_url: string; public_url: string; headers?: Record<string, string> };

export type SignMultipartBody = { filename: string; content_type: string; folder?: string };
export type SignMultipartResp = { upload_url: string; public_url: string; fields: Record<string, string> };

export const uploadsApi = baseApi3.injectEndpoints({
  endpoints: (b) => ({
    signPut: b.mutation<SignPutResp, SignPutBody>({
      query: (body) => ({ url: "/storage/uploads/sign-put", method: "POST", body }),
      transformResponse: (res: unknown): SignPutResp => res as SignPutResp,
    }),
    signMultipart: b.mutation<SignMultipartResp, SignMultipartBody>({
      query: (body) => ({ url: "/storage/uploads/sign-multipart", method: "POST", body }),
      transformResponse: (res: unknown): SignMultipartResp => res as SignMultipartResp,
    }),
  }),
  overrideExisting: true,
});

export const { useSignPutMutation, useSignMultipartMutation } = uploadsApi;
