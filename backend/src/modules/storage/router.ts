// src/modules/storage/router.ts
import type { FastifyInstance } from "fastify";
import { requireAuth } from "@/common/middleware/auth";
import { requireAdmin } from "@/common/middleware/roles";

import {
  publicServe,
  uploadToBucket,
  signPut,
  signMultipart,
  adminListAssets,
  adminGetAsset,
  adminCreateAsset,
  adminPatchAsset,
  adminDeleteAsset,
  adminBulkDelete,
  adminListFolders,
} from "./controller";

// 👇 EKLE: Body tipleri
import type { SignPutBody, SignMultipartBody, StorageUpdateInput } from "./validation";

export async function registerStorage(app: FastifyInstance) {
  app.get<{ Params: { bucket: string; "*": string } }>(
    "/storage/:bucket/*",
    { config: { public: true } },
    publicServe
  );

  app.post<{ Params: { bucket: string }; Querystring: { path?: string; upsert?: string } }>(
    "/storage/:bucket/upload",
    { preHandler: [requireAuth] },
    uploadToBucket
  );

  // ✅ Body genericlerini ekle
  app.post<{ Body: SignPutBody }>(
    "/storage/uploads/sign-put",
    { preHandler: [requireAuth] },
    signPut
  );

  app.post<{ Body: SignMultipartBody }>(
    "/storage/uploads/sign-multipart",
    { preHandler: [requireAuth] },
    signMultipart
  );

  app.get<{ Querystring: unknown }>(
  "/admin/storage/assets",
  { preHandler: [requireAuth, requireAdmin] },
  adminListAssets
);

  app.get<{ Params: { id: string } }>(
    "/admin/storage/assets/:id",
    { preHandler: [requireAuth, requireAdmin] },
    adminGetAsset
  );

  app.post(
    "/admin/storage/assets",
    { preHandler: [requireAuth, requireAdmin] },
    adminCreateAsset
  );

  // ✅ HATAYI ÇÖZEN SATIR: Body: StorageUpdateInput generic’ini ekle
  app.patch<{ Params: { id: string }; Body: StorageUpdateInput }>(
    "/admin/storage/assets/:id",
    { preHandler: [requireAuth, requireAdmin] },
    adminPatchAsset
  );

  app.delete<{ Params: { id: string } }>(
    "/admin/storage/assets/:id",
    { preHandler: [requireAuth, requireAdmin] },
    adminDeleteAsset
  );

  app.post<{ Body: { ids: string[] } }>(
    "/admin/storage/assets/bulk-delete",
    { preHandler: [requireAuth, requireAdmin] },
    adminBulkDelete
  );

  app.get(
    "/admin/storage/folders",
    { preHandler: [requireAuth, requireAdmin] },
    adminListFolders
  );
}
