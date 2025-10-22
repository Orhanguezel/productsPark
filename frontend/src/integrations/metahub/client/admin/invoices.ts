
// -------------------------------------------------------------
// FILE: src/integrations/metahub/client/admin/invoices.ts (Facade)
// -------------------------------------------------------------
import { store } from "@/store";
import { normalizeError } from "@/integrations/metahub/core/errors";
import {
  invoicesAdminApi,
  type Invoice,
  type InvoiceLine,
  type ListParams,
  type CreateInvoiceBody,
  type UpdateInvoiceBody,
  type MarkPaidBody,
  type SendEmailBody,
  type PdfResponse,
  type ExportParams,
  type ExportResponse,
} from "@/integrations/metahub/rtk/endpoints/admin/invoices_admin.endpoints";

export const invoicesAdmin = {
  async list(params?: ListParams) {
    try { const data = await store.dispatch(invoicesAdminApi.endpoints.listInvoicesAdmin.initiate(params)).unwrap(); return { data: data as Invoice[], error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Invoice[] | null, error: { message } }; }
  },
  async getById(id: string) {
    try { const data = await store.dispatch(invoicesAdminApi.endpoints.getInvoiceAdminById.initiate(id)).unwrap(); return { data: data as Invoice, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Invoice | null, error: { message } }; }
  },
  async create(body: CreateInvoiceBody) {
    try { const data = await store.dispatch(invoicesAdminApi.endpoints.createInvoiceAdmin.initiate(body)).unwrap(); return { data: data as Invoice, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Invoice | null, error: { message } }; }
  },
  async update(id: string, body: UpdateInvoiceBody) {
    try { const data = await store.dispatch(invoicesAdminApi.endpoints.updateInvoiceAdmin.initiate({ id, body })).unwrap(); return { data: data as Invoice, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Invoice | null, error: { message } }; }
  },
  async markPaid(id: string, body?: MarkPaidBody) {
    try { const data = await store.dispatch(invoicesAdminApi.endpoints.markInvoicePaidAdmin.initiate({ id, body })).unwrap(); return { data: data as Invoice, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Invoice | null, error: { message } }; }
  },
  async sendEmail(id: string, body?: SendEmailBody) {
    try { await store.dispatch(invoicesAdminApi.endpoints.sendInvoiceEmailAdmin.initiate({ id, body })).unwrap(); return { ok: true as const, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { ok: false as const, error: { message } }; }
  },
  async pdf(id: string) {
    try { const data = await store.dispatch(invoicesAdminApi.endpoints.getInvoicePdfAdmin.initiate({ id })).unwrap(); return { data: data as PdfResponse, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as PdfResponse | null, error: { message } }; }
  },
  async export(params?: ExportParams) {
    try { const data = await store.dispatch(invoicesAdminApi.endpoints.exportInvoicesAdmin.initiate(params)).unwrap(); return { data: data as ExportResponse, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as ExportResponse | null, error: { message } }; }
  },
};

export type { Invoice, InvoiceLine, ListParams, CreateInvoiceBody, UpdateInvoiceBody, MarkPaidBody, SendEmailBody, PdfResponse, ExportParams, ExportResponse };
