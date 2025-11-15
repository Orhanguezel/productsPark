// =============================================================
// Public Storage — tekli/çoklu dosya deterministik upload + sign-multipart
// =============================================================
import { baseApi } from "@/integrations/metahub/rtk/baseApi";
import type {
  StorageServerUploadArgs,
  StoragePublicUploadResponse,
  StorageSignMultipartBody,
  StorageSignMultipartResponse,
} from "@/integrations/metahub/db/types/storage";

const sanitize = (name: string) => name.replace(/[^\w.\-]+/g, "_");

type UploadManyResponse = { items: StoragePublicUploadResponse[] };

/** File[]’a kesin daraltma: undefined/null/yanlış tipleri atar */
function compactFiles(list: unknown[]): File[] {
  const out: File[] = [];
  for (const f of list) {
    if (!f) continue;
    if (typeof File !== "undefined" && f instanceof File) {
      out.push(f);
      continue;
    }
    if (typeof Blob !== "undefined" && f instanceof Blob) {
      try {
        const name = (f as any)?.name || "blob";
        out.push(new File([f], name, { type: f.type || "application/octet-stream" }));
      } catch {
        out.push(f as unknown as File);
      }
    }
  }
  return out;
}

export const storagePublicApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Server-side upload: /storage/:bucket/upload
    uploadToBucket: builder.mutation<
      UploadManyResponse,
      Omit<StorageServerUploadArgs, "file"> & { files: File | File[] }
    >({
      async queryFn(args, _api, _extra, baseQuery) {
        try {
          const rawList = Array.isArray(args.files) ? args.files : [args.files];
          const files = compactFiles(rawList as unknown[]);
          if (!files.length) {
            return { error: { status: 400, data: { message: "no_files" } } as any };
          }

          const items: StoragePublicUploadResponse[] = [];

          for (const [i, file] of files.entries()) {
            const fd = new FormData();
            const filename = sanitize(file.name || `file-${i}`);
            fd.append("file", file, filename);

            const qs = new URLSearchParams();
            if (args.path) qs.set("path", args.path);
            if (args.upsert) qs.set("upsert", "1");

            const res = await baseQuery({
              url: `/storage/${encodeURIComponent(args.bucket)}/upload${qs.toString() ? `?${qs}` : ""}`,
              method: "POST",
              body: fd,
            });
            if (res.error) return { error: res.error as any };

            const data = res.data as any;
            items.push({
              path: data.path,
              url: data.url,
            } satisfies StoragePublicUploadResponse);
          }

          return { data: { items } };
        } catch (e: any) {
          return {
            error: {
              status: e?.status || 500,
              data: e?.data || { message: e?.message || "upload_failed" },
            } as any,
          };
        }
      },
      invalidatesTags: () => [{ type: "Storage", id: "LIST" }],
    }),

    // Direct-to-Cloudinary (unsigned preset) için sign
    signMultipart: builder.mutation<
      StorageSignMultipartResponse,
      StorageSignMultipartBody & { content_type?: string }
    >({
      query: ({ filename, folder, content_type }) => ({
        url: "/storage/uploads/sign-multipart",
        method: "POST",
        body: {
          filename,
          folder,
          ...(content_type ? { content_type } : {}),
        },
      }),
    }),
  }),
  overrideExisting: true,
});

export const { useUploadToBucketMutation, useSignMultipartMutation } = storagePublicApi;
