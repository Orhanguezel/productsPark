// src/modules/storage/admin.routes.ts
import type { FastifyInstance } from "fastify";
import { requireAuth } from "@/common/middleware/auth";
import { requireAdmin } from "@/common/middleware/roles";
import {
  adminListAssets,
  adminGetAsset,
  adminCreateAsset,
  adminPatchAsset,
  adminDeleteAsset,
  adminBulkDelete,
  adminListFolders,
  adminDiagCloudinary,
  adminBulkCreateAssets, 
} from "./admin.controller";

import type { StorageUpdateInput } from "./validation";

export async function registerStorageAdmin(app: FastifyInstance) {
  const BASE = "/storage";

  app.get<{ Querystring: unknown }>(
    `${BASE}/assets`,
    { preHandler: [requireAuth, requireAdmin] },
    adminListAssets
  );

  app.get<{ Params: { id: string } }>(
    `${BASE}/assets/:id`,
    { preHandler: [requireAuth, requireAdmin] },
    adminGetAsset
  );

  app.post(
    `${BASE}/assets`,
    { preHandler: [requireAuth, requireAdmin] },
    adminCreateAsset
  );

  // Bulk upload (çoklu dosya)
  app.post(
    `${BASE}/assets/bulk`,
    { preHandler: [requireAuth, requireAdmin] },
    adminBulkCreateAssets
  );

  // PATCH body tipini belirt
  app.patch<{ Params: { id: string }; Body: StorageUpdateInput }>(
    `${BASE}/assets/:id`,
    { preHandler: [requireAuth, requireAdmin] },
    adminPatchAsset
  );

  app.delete<{ Params: { id: string } }>(
    `${BASE}/assets/:id`,
    { preHandler: [requireAuth, requireAdmin] },
    adminDeleteAsset
  );

  app.post<{ Body: { ids: string[] } }>(
    `${BASE}/assets/bulk-delete`,
    { preHandler: [requireAuth, requireAdmin] },
    adminBulkDelete
  );

  app.get(
    `${BASE}/folders`,
    { preHandler: [requireAuth, requireAdmin] },
    adminListFolders
  );

  app.get(
    `${BASE}/_diag/cloud`,
    { preHandler: [requireAuth, requireAdmin] },
    adminDiagCloudinary
  );
}
