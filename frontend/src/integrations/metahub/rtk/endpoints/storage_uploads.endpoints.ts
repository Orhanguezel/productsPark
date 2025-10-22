
// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/storage_uploads.endpoints.ts
// -------------------------------------------------------------
import { baseApi as baseApi3 } from "../baseApi";

export type SignedPut = { strategy: "put"; url: string; headers?: Record<string, string>; final_url: string };
export type SignedPost = { strategy: "post"; url: string; fields: Record<string, string>; final_url: string };
export type SignedUpload = SignedPut | SignedPost;

export type RequestUploadBody = { filename: string; content_type: string; folder?: string };

export const storageUploadsApi = baseApi3.injectEndpoints({
  endpoints: (b) => ({
    requestUpload: b.mutation<SignedUpload, RequestUploadBody>({
      query: (body) => ({ url: "/storage/uploads/request", method: "POST", body }),
      transformResponse: (res: unknown): SignedUpload => res as SignedUpload,
      invalidatesTags: [],
    }),
  }),
  overrideExisting: true,
});

export const { useRequestUploadMutation } = storageUploadsApi;