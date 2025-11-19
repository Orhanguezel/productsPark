// =============================================================
// FILE: src/routes/admin/registerDbAdmin.ts
// =============================================================
import type { FastifyInstance } from "fastify";
import { requireAuth } from "@/common/middleware/auth";
import {
  // Export (SQL / JSON)
  adminExportSql,
  // Import handlers
  adminImportSqlText,
  adminImportSqlFromUrl,
  adminImportSqlFromFile,
  // Snapshot handlers
  adminListDbSnapshots,
  adminCreateDbSnapshot,
  adminRestoreDbSnapshot,
  adminDeleteDbSnapshot,
} from "./admin.controller";

export async function registerDbAdmin(app: FastifyInstance) {
  const BASE = "/admin/db";

  // -------------------------------------------------------------------
  // EXPORT: GET /admin/db/export
  //  - ?format=sql  (veya boş) -> .sql dump
  //  - ?format=json            -> JSON dump
  // -------------------------------------------------------------------
  app.get(`${BASE}/export`, { preHandler: [requireAuth] }, adminExportSql);

  // -------------------------------------------------------------------
  // IMPORT seçenekleri
  // -------------------------------------------------------------------
  app.post(
    `${BASE}/import-sql`,
    { preHandler: [requireAuth] },
    adminImportSqlText
  );

  app.post(
    `${BASE}/import-url`,
    { preHandler: [requireAuth] },
    adminImportSqlFromUrl
  );

  app.post(
    `${BASE}/import-file`,
    { preHandler: [requireAuth] },
    adminImportSqlFromFile
  );

  // -------------------------------------------------------------------
  // SNAPSHOT API
  // -------------------------------------------------------------------

  // Sunucuda saklanan snapshot listesi
  app.get(
    `${BASE}/snapshots`,
    { preHandler: [requireAuth] },
    adminListDbSnapshots
  );

  // Yeni snapshot oluştur (uploads/db_snapshots içine .sql kaydeder)
  app.post(
    `${BASE}/snapshots`,
    { preHandler: [requireAuth] },
    adminCreateDbSnapshot
  );

  // Snapshot'tan geri yükle
  app.post(
    `${BASE}/snapshots/:id/restore`,
    { preHandler: [requireAuth] },
    adminRestoreDbSnapshot
  );

  // Snapshot sil
  app.delete(
    `${BASE}/snapshots/:id`,
    { preHandler: [requireAuth] },
    adminDeleteDbSnapshot
  );
}
