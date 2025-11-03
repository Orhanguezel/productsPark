// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/storage_public.endpoints.ts
// =============================================================
import { baseApi } from "../baseApi";
import type { FetchArgs } from "@reduxjs/toolkit/query";
import type {
  StoragePublicUploadResponse,
  StorageSignMultipartResponse,
  StorageSignMultipartBody,
  StorageServerUploadArgs,
} from "../../db/types/storage";

// NOT: publicServe (GET /storage/:bucket/*) 302 redirect döndürür.
// FE tarafında genelde direkt Cloudinary secure_url kullanacağımız için RTK
// uçuna gerek duymuyoruz. Gerekirse sadece URL builder helper yaz.

const BASE = "/storage";

export const storagePublicApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /** Client-side unsigned upload hazırlığı (Cloudinary form fields) */
    signMultipart: b.mutation<StorageSignMultipartResponse, StorageSignMultipartBody>({
      query: (body) =>
        ({ url: `${BASE}/uploads/sign-multipart`, method: "POST", body } as FetchArgs),
    }),

    /** Server-side signed upload (dosyayı API'ye gönderir; DB kayıt oluşur) */
    uploadToBucket: b.mutation<StoragePublicUploadResponse, StorageServerUploadArgs>({
      query: ({ bucket, file, path, upsert }) => {
        const form = new FormData();
        form.append("file", file);
        const usp = new URLSearchParams();
        if (path) usp.set("path", path);
        if (upsert != null) usp.set("upsert", upsert ? "1" : "0");
        const fa: FetchArgs = {
          url: `${BASE}/${encodeURIComponent(bucket)}/upload${usp.toString() ? `?${usp.toString()}` : ""}`,
          method: "POST",
          body: form,
        };
        return fa;
      },
    }),
  }),
  overrideExisting: true,
});

export const {
  useSignMultipartMutation,
  useUploadToBucketMutation,
} = storagePublicApi;

/** İsteğe bağlı yardımcı: public-serve URL kurucu (redirect eder) */
export const buildPublicServeUrl = (bucket: string, path: string) =>
  `${BASE}/${encodeURIComponent(bucket)}/${path.split("/").map(encodeURIComponent).join("/")}`;
