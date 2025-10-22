
// -------------------------------------------------------------
// FILE: src/integrations/metahub/client/admin/audit.ts (Facade)
// -------------------------------------------------------------
import { store } from "@/store";
import { normalizeError } from "@/integrations/metahub/core/errors";
import {
  auditAdminApi,
  type AuditLog,
  type AuditListParams,
  type ExportResponse,
  type ConfigChange,
  type ConfigListParams,
  type ConfigDiff,
  type RevertBody,
} from "@/integrations/metahub/rtk/endpoints/admin/audit_admin.endpoints";

export const auditAdmin = {
  async logs(params?: AuditListParams) {
    try {
      const data = await store.dispatch(auditAdminApi.endpoints.listAuditLogsAdmin.initiate(params)).unwrap(); return { data: data as AuditLog[], error: null as null };
    } catch (e) { const { message } = normalizeError(e); return { data: null as AuditLog[] | null, error: { message } }; }
  },
  async log(id: string) {
    try {
      const data = await store.dispatch(auditAdminApi.endpoints.getAuditLogAdminById.initiate(id)).unwrap(); return { data: data as AuditLog, error: null as null };
    } catch (e) { const { message } = normalizeError(e); return { data: null as AuditLog | null, error: { message } }; }
  },
  async exportLogs(params?: AuditListParams) {
    try {
      const data = await store.dispatch(auditAdminApi.endpoints.exportAuditLogsAdmin.initiate(params)).unwrap(); return { data: data as ExportResponse, error: null as null };
    } catch (e) { const { message } = normalizeError(e); return { data: null as ExportResponse | null, error: { message } }; }
  },

  async configList(params?: ConfigListParams) {
    try {
      const data = await store.dispatch(auditAdminApi.endpoints.listConfigHistoryAdmin.initiate(params)).unwrap(); return { data: data as ConfigChange[], error: null as null };
    } catch (e) { const { message } = normalizeError(e); return { data: null as ConfigChange[] | null, error: { message } }; }
  },
  async configById(id: string) {
    try {
      const data = await store.dispatch(auditAdminApi.endpoints.getConfigChangeAdminById.initiate(id)).unwrap(); return { data: data as ConfigChange, error: null as null };
    } catch (e) { const { message } = normalizeError(e); return { data: null as ConfigChange | null, error: { message } }; }
  },
  async configDiff(id: string) {
    try {
      const data = await store.dispatch(auditAdminApi.endpoints.getConfigChangeDiffAdmin.initiate(id)).unwrap(); return { data: data as ConfigDiff, error: null as null };
    } catch (e) { const { message } = normalizeError(e); return { data: null as ConfigDiff | null, error: { message } }; }
  },
  async configRevert(id: string, body?: RevertBody) {
    try {
      const data = await store.dispatch(auditAdminApi.endpoints.revertConfigChangeAdmin.initiate({ id, body })).unwrap(); return { data: data as ConfigChange, error: null as null };
    } catch (e) { const { message } = normalizeError(e); return { data: null as ConfigChange | null, error: { message } }; }
  },
  async exportConfig(params?: ConfigListParams) {
    try {
      const data = await store.dispatch(auditAdminApi.endpoints.exportConfigHistoryAdmin.initiate(params)).unwrap(); return { data: data as ExportResponse, error: null as null };
    } catch (e) { const { message } = normalizeError(e); return { data: null as ExportResponse | null, error: { message } }; }
  },
};

export type { AuditLog, AuditListParams, ExportResponse, ConfigChange, ConfigListParams, ConfigDiff, RevertBody };
