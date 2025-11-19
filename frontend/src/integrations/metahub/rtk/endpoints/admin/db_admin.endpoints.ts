// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/admin/db_admin.endpoints.ts
// =============================================================
import { baseApi } from "../../baseApi";

/* -------- Types -------- */
export type DbImportResponse = {
  ok: boolean;
  dryRun?: boolean;
  message?: string;
  error?: string;
};

export type SqlImportCommon = {
  /** Varolan verileri temizleyip içe aktar */
  truncateBefore?: boolean;
  /** İşlemi prova olarak çalıştır (yalnızca /import-sql ve /import-url destekler) */
  dryRun?: boolean;
};

export type SqlImportTextParams = SqlImportCommon & {
  /** Tam SQL script (utf8) */
  sql: string;
};

export type SqlImportUrlParams = SqlImportCommon & {
  /** .sql veya .sql.gz URL */
  url: string;
};

export type SqlImportFileParams = {
  /** .sql veya .gz dosya */
  file: File;
  /** Varolan verileri temizleyip içe aktar */
  truncateBefore?: boolean;
};

/* (ESKİ) Geriye dönük: bazı yerlerde bu tip adı geçiyorsa bozulmasın. */
export type SqlImportParams = {
  tenant?: string; // tenantsızda yok sayılır
  truncate_before_import?: boolean; // eski alan adı
};

/* -------- Snapshot Types -------- */
export type DbSnapshot = {
  id: string;
  filename?: string | null;
  label?: string | null;
  note?: string | null;
  created_at: string;
  size_bytes?: number | null;
};

export type CreateDbSnapshotBody = {
  label?: string;
  note?: string;
};

export type DeleteSnapshotResponse = {
  ok: boolean;
  message?: string;
};

export const dbAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /* ---------------------------------------------------------
     * EXPORT SQL: GET /admin/db/export  -> Blob (.sql)
     * --------------------------------------------------------- */
    exportSql: b.mutation<Blob, void>({
      query: () => ({
        url: "/admin/db/export",
        method: "GET",
        credentials: "include",
        // Blob'u TS uyumlu almak için arrayBuffer + transform
        responseHandler: (resp: Response) => resp.arrayBuffer(),
      }),
      transformResponse: (ab: ArrayBuffer) =>
        new Blob([ab], { type: "application/sql" }),
    }),

    /* ---------------------------------------------------------
     * EXPORT JSON: GET /admin/db/export?format=json  -> Blob (.json)
     * (BE tarafında format=json desteği olması gerekiyor)
     * --------------------------------------------------------- */
    exportJson: b.mutation<Blob, void>({
      query: () => ({
        url: "/admin/db/export",
        method: "GET",
        params: { format: "json" },
        credentials: "include",
        responseHandler: (resp: Response) => resp.arrayBuffer(),
      }),
      transformResponse: (ab: ArrayBuffer) =>
        new Blob([ab], { type: "application/json" }),
    }),

    /* ---------------------------------------------------------
     * IMPORT (TEXT): POST /admin/db/import-sql
     * body: { sql, dryRun?, truncateBefore? }
     * --------------------------------------------------------- */
    importSqlText: b.mutation<DbImportResponse, SqlImportTextParams>({
      query: (body) => ({
        url: "/admin/db/import-sql",
        method: "POST",
        body,
        credentials: "include",
      }),
    }),

    /* ---------------------------------------------------------
     * IMPORT (URL): POST /admin/db/import-url
     * body: { url, dryRun?, truncateBefore? }  (gzip destekli)
     * --------------------------------------------------------- */
    importSqlUrl: b.mutation<DbImportResponse, SqlImportUrlParams>({
      query: (body) => ({
        url: "/admin/db/import-url",
        method: "POST",
        body,
        credentials: "include",
      }),
    }),

    /* ---------------------------------------------------------
     * IMPORT (FILE): POST /admin/db/import-file
     * multipart: file(.sql|.gz) + fields: truncateBefore?
     * (BE eski alan adı truncate_before_import'u da kabul ediyor)
     * --------------------------------------------------------- */
    importSqlFile: b.mutation<DbImportResponse, SqlImportFileParams>({
      query: ({ file, truncateBefore }) => {
        const form = new FormData();
        form.append("file", file, file.name);
        if (typeof truncateBefore !== "undefined") {
          form.append("truncateBefore", String(!!truncateBefore));
          // eski alan adına da yazalım (tam uyumluluk)
          form.append("truncate_before_import", String(!!truncateBefore));
        }
        return {
          url: "/admin/db/import-file",
          method: "POST",
          body: form,
          credentials: "include",
        };
      },
    }),

    /* ---------------------------------------------------------
     * (GERİYE DÖNÜK ALIAS)
     * importSql: eski kullanımda file upload bekliyordu.
     * İçeride /admin/db/import-file'a yönlendiriyoruz.
     * --------------------------------------------------------- */
    importSql: b.mutation<
      DbImportResponse,
      { file: File } & Partial<SqlImportParams>
    >({
      query: ({ file, truncate_before_import }) => {
        const form = new FormData();
        form.append("file", file, file.name);
        if (typeof truncate_before_import !== "undefined") {
          form.append("truncateBefore", String(!!truncate_before_import));
          form.append("truncate_before_import", String(!!truncate_before_import));
        }
        return {
          url: "/admin/db/import-file",
          method: "POST",
          body: form,
          credentials: "include",
        };
      },
    }),

    /* ---------------------------------------------------------
     * SNAPSHOT LİSTESİ: GET /admin/db/snapshots
     * --------------------------------------------------------- */
    listDbSnapshots: b.query<DbSnapshot[], void>({
      query: () => ({
        url: "/admin/db/snapshots",
        method: "GET",
        credentials: "include",
      }),
    }),

    /* ---------------------------------------------------------
     * SNAPSHOT OLUŞTUR: POST /admin/db/snapshots
     * body: { label?, note? }
     * --------------------------------------------------------- */
    createDbSnapshot: b.mutation<DbSnapshot, CreateDbSnapshotBody | void>({
      query: (body) => ({
        url: "/admin/db/snapshots",
        method: "POST",
        body: body ?? {},
        credentials: "include",
      }),
    }),

    /* ---------------------------------------------------------
     * SNAPSHOT'TAN GERİ YÜKLE:
     * POST /admin/db/snapshots/:id/restore
     * body: { truncateBefore?: boolean, dryRun?: boolean }
     * --------------------------------------------------------- */
    restoreDbSnapshot: b.mutation<
      DbImportResponse,
      { id: string; dryRun?: boolean; truncateBefore?: boolean }
    >({
      query: ({ id, dryRun, truncateBefore }) => ({
        url: `/admin/db/snapshots/${encodeURIComponent(id)}/restore`,
        method: "POST",
        body: {
          truncateBefore: truncateBefore ?? true,
          dryRun: dryRun ?? false,
        },
        credentials: "include",
      }),
    }),

    /* ---------------------------------------------------------
     * SNAPSHOT SİL: DELETE /admin/db/snapshots/:id
     * --------------------------------------------------------- */
    deleteDbSnapshot: b.mutation<DeleteSnapshotResponse, { id: string }>({
      query: ({ id }) => ({
        url: `/admin/db/snapshots/${encodeURIComponent(id)}`,
        method: "DELETE",
        credentials: "include",
      }),
    }),
  }),
  overrideExisting: true,
});

export const {
  useExportSqlMutation,
  useExportJsonMutation,          // ✅ yeni hook
  useImportSqlTextMutation,
  useImportSqlUrlMutation,
  useImportSqlFileMutation,
  // geriye dönük:
  useImportSqlMutation,
  // snapshot hooks:
  useListDbSnapshotsQuery,
  useCreateDbSnapshotMutation,
  useRestoreDbSnapshotMutation,
  useDeleteDbSnapshotMutation,
} = dbAdminApi;
