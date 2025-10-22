// -------------------------------------------------------------
// FILE: src/integrations/metahub/client/audit/client.ts (Facade)
// -------------------------------------------------------------
import { store as storeAu } from "@/store";
import { normalizeError as nErrAu } from "@/integrations/metahub/core/errors";
import { auditEventsApi, type AuditEvent } from "@/integrations/metahub/rtk/endpoints/audit_events.endpoints";

export type { AuditEvent };

export const audit = {
  async list(params?: Parameters<typeof auditEventsApi.endpoints.listAuditEvents.initiate>[0]) {
    try { const data = await storeAu.dispatch(auditEventsApi.endpoints.listAuditEvents.initiate(params ?? {})).unwrap(); return { data: data as AuditEvent[], error: null as null }; }
    catch (e) { const { message } = nErrAu(e); return { data: null as AuditEvent[] | null, error: { message } }; }
  },
  async getById(id: string) {
    try { const data = await storeAu.dispatch(auditEventsApi.endpoints.getAuditEventById.initiate(id)).unwrap(); return { data: data as AuditEvent, error: null as null }; }
    catch (e) { const { message } = nErrAu(e); return { data: null as AuditEvent | null, error: { message } }; }
  },
};