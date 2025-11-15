// =============================================================
// FILE: src/integrations/metahub/db/types/storage.ts
// =============================================================

export type StorageMeta = Record<string, string> | null;

export type StorageAsset = {
  id: string;
  name: string;
  bucket: string;
  path: string;
  folder: string | null;
  mime: string;
  size: number;
  width?: number | null;
  height?: number | null;
  url?: string | null;
  metadata: StorageMeta;
  created_at: string;
  updated_at: string;
};

export type ApiStorageAsset = Omit<
  StorageAsset,
  "size" | "width" | "height" | "metadata" | "created_at" | "updated_at"
> & {
  size: number | string;
  width?: number | string | null;
  height?: number | string | null;
  metadata: string | StorageMeta;
  created_at: string | number | Date;
  updated_at: string | number | Date;
};

export type StorageListParams = {
  q?: string;
  bucket?: string;
  folder?: string | null;
  mime?: string;
  limit?: number;
  offset?: number;
  sort?: "created_at" | "name" | "size";
  order?: "asc" | "desc";
};

/** ---- Public endpoints tipleri ---- */

/** POST /storage/uploads/sign-multipart */
export type StorageSignMultipartBody = {
  filename: string;
  folder?: string;
};

export type StorageSignMultipartResponse = {
  upload_url: string;
  fields: Record<string, string>;
};

/** POST /storage/:bucket/upload?path=&upsert= */
export type StoragePublicUploadResponse = {
  path: string;
  url: string;
};

export type StorageServerUploadArgs = {
  bucket: string;
  file: File;
  path?: string;      // "folder/name.ext" gibi
  upsert?: boolean;
};


export type StorageListQuery = {
  q?: string;
  bucket?: string;
  folder?: string | null;
  mime?: string;
  limit?: number; offset?: number;
  sort?: "created_at" | "name" | "size";
  order?: "asc" | "desc";
};
export type StorageUpdateInput = {
  name?: string;
  folder?: string | null;
  metadata?: Record<string, string> | null;
};
