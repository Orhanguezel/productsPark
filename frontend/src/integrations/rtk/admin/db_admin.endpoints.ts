// =============================================================
// FILE: src/integrations/rtk/admin/db_admin.endpoints.ts
// FINAL — Admin DB RTK (export/import/snapshots) + legacy alias
// - adds tagTypes: DbSnapshots, DbAdmin
// - exportSql/exportJson => Blob
// =============================================================

import { baseApi } from '@/integrations/baseApi';

import type {
  DbImportResponse,
  SqlImportTextParams,
  SqlImportUrlParams,
  SqlImportFileParams,
  SqlImportParamsLegacy,
  DbSnapshot,
  CreateDbSnapshotBody,
  DeleteSnapshotResponse,
} from '@/integrations/types';

const BASE = '/admin/db';

const extendedApi = baseApi.enhanceEndpoints({
  addTagTypes: ['DbSnapshots', 'DbAdmin'] as const,
});

export const dbAdminApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    /* ---------------------------------------------------------
     * EXPORT SQL: GET /admin/db/export  -> Blob (.sql)
     * --------------------------------------------------------- */
    exportSql: b.mutation<Blob, void>({
      query: () => ({
        url: `${BASE}/export`,
        method: 'GET',
        responseHandler: (resp: Response) => resp.arrayBuffer(),
      }),
      transformResponse: (ab: ArrayBuffer) => new Blob([ab], { type: 'application/sql' }),
    }),

    /* ---------------------------------------------------------
     * EXPORT JSON: GET /admin/db/export-json -> Blob (.json)
     * (Eğer backend’de endpoint adı farklıysa burayı ona göre değiştir)
     * --------------------------------------------------------- */
    exportJson: b.mutation<Blob, void>({
      query: () => ({
        url: `${BASE}/export-json`,
        method: 'GET',
        responseHandler: (resp: Response) => resp.arrayBuffer(),
      }),
      transformResponse: (ab: ArrayBuffer) => new Blob([ab], { type: 'application/json' }),
    }),

    /* ---------------------------------------------------------
     * IMPORT (TEXT): POST /admin/db/import-sql
     * --------------------------------------------------------- */
    importSqlText: b.mutation<DbImportResponse, SqlImportTextParams>({
      query: (body) => ({
        url: `${BASE}/import-sql`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'DbAdmin' as const, id: 'STATE' }],
    }),

    /* ---------------------------------------------------------
     * IMPORT (URL): POST /admin/db/import-url
     * --------------------------------------------------------- */
    importSqlUrl: b.mutation<DbImportResponse, SqlImportUrlParams>({
      query: (body) => ({
        url: `${BASE}/import-url`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'DbAdmin' as const, id: 'STATE' }],
    }),

    /* ---------------------------------------------------------
     * IMPORT (FILE): POST /admin/db/import-file (multipart)
     * --------------------------------------------------------- */
    importSqlFile: b.mutation<DbImportResponse, SqlImportFileParams>({
      query: ({ file, truncateBefore }) => {
        const form = new FormData();
        form.append('file', file, file.name);

        if (typeof truncateBefore !== 'undefined') {
          form.append('truncateBefore', String(!!truncateBefore));
          form.append('truncate_before_import', String(!!truncateBefore)); // legacy
        }

        return {
          url: `${BASE}/import-file`,
          method: 'POST',
          body: form,
        };
      },
      invalidatesTags: [
        { type: 'DbSnapshots' as const, id: 'LIST' },
        { type: 'DbAdmin' as const, id: 'STATE' },
      ],
    }),

    /* ---------------------------------------------------------
     * (LEGACY ALIAS) importSql
     * --------------------------------------------------------- */
    importSql: b.mutation<DbImportResponse, { file: File } & Partial<SqlImportParamsLegacy>>({
      query: ({ file, truncate_before_import }) => {
        const form = new FormData();
        form.append('file', file, file.name);

        if (typeof truncate_before_import !== 'undefined') {
          form.append('truncateBefore', String(!!truncate_before_import));
          form.append('truncate_before_import', String(!!truncate_before_import));
        }

        return {
          url: `${BASE}/import-file`,
          method: 'POST',
          body: form,
        };
      },
      invalidatesTags: [
        { type: 'DbSnapshots' as const, id: 'LIST' },
        { type: 'DbAdmin' as const, id: 'STATE' },
      ],
    }),

    /* ---------------------------------------------------------
     * SNAPSHOT LIST: GET /admin/db/snapshots
     * --------------------------------------------------------- */
    listDbSnapshots: b.query<DbSnapshot[], void>({
      query: () => ({ url: `${BASE}/snapshots`, method: 'GET' }),
      providesTags: (res) =>
        res?.length
          ? [
              { type: 'DbSnapshots' as const, id: 'LIST' },
              ...res.map((s) => ({ type: 'DbSnapshots' as const, id: s.id })),
            ]
          : [{ type: 'DbSnapshots' as const, id: 'LIST' }],
      keepUnusedDataFor: 30,
    }),

    /* ---------------------------------------------------------
     * SNAPSHOT CREATE: POST /admin/db/snapshots
     * --------------------------------------------------------- */
    createDbSnapshot: b.mutation<DbSnapshot, CreateDbSnapshotBody | void>({
      query: (body) => ({
        url: `${BASE}/snapshots`,
        method: 'POST',
        body: body ?? {},
      }),
      invalidatesTags: [{ type: 'DbSnapshots' as const, id: 'LIST' }],
    }),

    /* ---------------------------------------------------------
     * SNAPSHOT RESTORE: POST /admin/db/snapshots/:id/restore
     * --------------------------------------------------------- */
    restoreDbSnapshot: b.mutation<
      DbImportResponse,
      { id: string; dryRun?: boolean; truncateBefore?: boolean }
    >({
      query: ({ id, dryRun, truncateBefore }) => ({
        url: `${BASE}/snapshots/${encodeURIComponent(id)}/restore`,
        method: 'POST',
        body: {
          truncateBefore: truncateBefore ?? true,
          dryRun: dryRun ?? false,
        },
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'DbSnapshots' as const, id: 'LIST' },
        { type: 'DbSnapshots' as const, id: arg.id },
        { type: 'DbAdmin' as const, id: 'STATE' },
      ],
    }),

    /* ---------------------------------------------------------
     * SNAPSHOT DELETE: DELETE /admin/db/snapshots/:id
     * --------------------------------------------------------- */
    deleteDbSnapshot: b.mutation<DeleteSnapshotResponse, { id: string }>({
      query: ({ id }) => ({
        url: `${BASE}/snapshots/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'DbSnapshots' as const, id: 'LIST' },
        { type: 'DbSnapshots' as const, id: arg.id },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useExportSqlMutation,
  useExportJsonMutation,

  useImportSqlTextMutation,
  useImportSqlUrlMutation,
  useImportSqlFileMutation,

  // legacy:
  useImportSqlMutation,

  // snapshots:
  useListDbSnapshotsQuery,
  useCreateDbSnapshotMutation,
  useRestoreDbSnapshotMutation,
  useDeleteDbSnapshotMutation,
} = dbAdminApi;
