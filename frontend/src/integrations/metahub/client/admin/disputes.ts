
// -------------------------------------------------------------
// FILE: src/integrations/metahub/client/admin/disputes.ts (Facade)
// -------------------------------------------------------------
import { store as store2 } from "@/store";
import { normalizeError as normalizeError2 } from "@/integrations/metahub/core/errors";
import {
  disputesAdminApi,
  type Dispute,
  type DisputeListParams,
  type AssignDisputeBody,
  type SubmitEvidenceBody,
  type DisputeEvidenceFile,
  type DisputeNote,
  type DisputesExportParams,
  type ExportResponse as ExportResponse2,
} from "@/integrations/metahub/rtk/endpoints/admin/disputes_admin.endpoints";

export const disputesAdmin = {
  async list(params?: DisputeListParams) {
    try { const data = await store2.dispatch(disputesAdminApi.endpoints.listDisputesAdmin.initiate(params)).unwrap(); return { data: data as Dispute[], error: null as null }; }
    catch (e) { const { message } = normalizeError2(e); return { data: null as Dispute[] | null, error: { message } }; }
  },
  async getById(id: string) {
    try { const data = await store2.dispatch(disputesAdminApi.endpoints.getDisputeAdminById.initiate(id)).unwrap(); return { data: data as Dispute, error: null as null }; }
    catch (e) { const { message } = normalizeError2(e); return { data: null as Dispute | null, error: { message } }; }
  },
  async assign(id: string, body: AssignDisputeBody) {
    try { const data = await store2.dispatch(disputesAdminApi.endpoints.assignDisputeAdmin.initiate({ id, body })).unwrap(); return { data: data as Dispute, error: null as null }; }
    catch (e) { const { message } = normalizeError2(e); return { data: null as Dispute | null, error: { message } }; }
  },
  async submitEvidence(id: string, body: SubmitEvidenceBody) {
    try { const data = await store2.dispatch(disputesAdminApi.endpoints.submitDisputeEvidenceAdmin.initiate({ id, body })).unwrap(); return { data: data as DisputeEvidenceFile[], error: null as null }; }
    catch (e) { const { message } = normalizeError2(e); return { data: null as DisputeEvidenceFile[] | null, error: { message } }; }
  },
  async deleteEvidence(id: string, evidence_id: string) {
    try { await store2.dispatch(disputesAdminApi.endpoints.deleteDisputeEvidenceAdmin.initiate({ id, evidence_id })).unwrap(); return { ok: true as const, error: null as null }; }
    catch (e) { const { message } = normalizeError2(e); return { ok: false as const, error: { message } }; }
  },
  async finalize(id: string) {
    try { const data = await store2.dispatch(disputesAdminApi.endpoints.finalizeDisputeAdmin.initiate(id)).unwrap(); return { data: data as Dispute, error: null as null }; }
    catch (e) { const { message } = normalizeError2(e); return { data: null as Dispute | null, error: { message } }; }
  },
  async accept(id: string, reason?: string | null) {
    try { const data = await store2.dispatch(disputesAdminApi.endpoints.acceptDisputeAdmin.initiate({ id, reason })).unwrap(); return { data: data as Dispute, error: null as null }; }
    catch (e) { const { message } = normalizeError2(e); return { data: null as Dispute | null, error: { message } }; }
  },
  async evidence(id: string) {
    try { const data = await store2.dispatch(disputesAdminApi.endpoints.listDisputeEvidenceAdmin.initiate({ id })).unwrap(); return { data: data as DisputeEvidenceFile[], error: null as null }; }
    catch (e) { const { message } = normalizeError2(e); return { data: null as DisputeEvidenceFile[] | null, error: { message } }; }
  },
  async notes(id: string, limit?: number, offset?: number) {
    try { const data = await store2.dispatch(disputesAdminApi.endpoints.listDisputeNotesAdmin.initiate({ id, limit, offset })).unwrap(); return { data: data as DisputeNote[], error: null as null }; }
    catch (e) { const { message } = normalizeError2(e); return { data: null as DisputeNote[] | null, error: { message } }; }
  },
  async addNote(id: string, message: string, visibility: "internal" | "public" = "internal") {
    try { const data = await store2.dispatch(disputesAdminApi.endpoints.addDisputeNoteAdmin.initiate({ id, message, visibility })).unwrap(); return { data: data as DisputeNote, error: null as null }; }
    catch (e) { const { message } = normalizeError2(e); return { data: null as DisputeNote | null, error: { message } }; }
  },
  async export(params?: DisputesExportParams) {
    try { const data = await store2.dispatch(disputesAdminApi.endpoints.exportDisputesAdmin.initiate(params)).unwrap(); return { data: data as ExportResponse2, error: null as null }; }
    catch (e) { const { message } = normalizeError2(e); return { data: null as ExportResponse2 | null, error: { message } }; }
  },
};

export type { Dispute, DisputeListParams, AssignDisputeBody, SubmitEvidenceBody, DisputeEvidenceFile, DisputeNote, DisputesExportParams, ExportResponse2 };
