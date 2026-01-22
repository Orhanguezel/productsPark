// =============================================================
// FILE: src/integrations/types/db_admin.ts
// FINAL — DB Admin types (import/export/snapshots)
// =============================================================

export type DbImportResponse = {
  ok: boolean;
  dryRun?: boolean;
  message?: string;
  error?: string;
};

export type SqlImportCommon = {
  truncateBefore?: boolean;
  dryRun?: boolean;
};

export type SqlImportTextParams = SqlImportCommon & {
  sql: string;
};

export type SqlImportUrlParams = SqlImportCommon & {
  url: string;
};

export type SqlImportFileParams = {
  file: File;
  truncateBefore?: boolean;
};

export type SqlImportParamsLegacy = {
  tenant?: string;
  truncate_before_import?: boolean;
};

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
