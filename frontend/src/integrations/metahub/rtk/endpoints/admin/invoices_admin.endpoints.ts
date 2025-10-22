
// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/invoices_admin.endpoints.ts
// -------------------------------------------------------------
import { baseApi } from "../../baseApi";

// helpers
const toNumber = (x: unknown): number => (typeof x === "number" ? x : Number(x as unknown));
const toNullableNumber = (x: unknown): number | null => (x == null ? null : toNumber(x));
const toIso = (x: unknown): string | null => {
  if (!x) return null;
  const d = typeof x === "string" ? new Date(x) : (x as Date);
  return new Date(d).toISOString();
};
const tryParse = <T>(x: unknown): T => {
  if (typeof x === "string") { try { return JSON.parse(x) as T; } catch { /* ignore */ } }
  return x as T;
};

export type InvoiceStatus = "draft" | "issued" | "overdue" | "paid" | "cancelled";

export type InvoiceLine = {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number; // quantity * unit_price (after discounts)
  product_id?: string | null;
  order_id?: string | null;
};

export type ApiInvoiceLine = Omit<InvoiceLine, "quantity" | "unit_price" | "amount"> & {
  quantity: number | string;
  unit_price: number | string;
  amount: number | string;
};

const normalizeLine = (l: ApiInvoiceLine): InvoiceLine => ({
  ...l,
  quantity: toNumber(l.quantity),
  unit_price: toNumber(l.unit_price),
  amount: toNumber(l.amount),
  product_id: (l.product_id ?? null) as string | null,
  order_id: (l.order_id ?? null) as string | null,
});

export type Invoice = {
  id: string;
  number: string;
  status: InvoiceStatus;
  currency: string;             // TRY, USD, ...
  subtotal: number;
  discount_total: number | null;
  tax_total: number | null;
  total: number;
  paid_total: number;
  balance_due: number;
  issue_date: string;           // ISO
  due_date: string | null;      // ISO
  customer_id: string | null;
  customer_email: string | null;
  billing_name: string | null;
  billing_address: string | null;
  lines: InvoiceLine[];
  payment_url: string | null;
  pdf_url: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;           // ISO
  updated_at: string | null;    // ISO
};

export type ApiInvoice = Omit<Invoice,
  | "subtotal" | "discount_total" | "tax_total" | "total" | "paid_total" | "balance_due"
  | "lines" | "due_date" | "updated_at"
> & {
  subtotal: number | string;
  discount_total: number | string | null;
  tax_total: number | string | null;
  total: number | string;
  paid_total: number | string;
  balance_due: number | string;
  lines: string | ApiInvoiceLine[];
  due_date: string | null;
  updated_at: string | null;
};

const normalizeInvoice = (i: ApiInvoice): Invoice => ({
  ...i,
  subtotal: toNumber(i.subtotal),
  discount_total: toNullableNumber(i.discount_total),
  tax_total: toNullableNumber(i.tax_total),
  total: toNumber(i.total),
  paid_total: toNumber(i.paid_total),
  balance_due: toNumber(i.balance_due),
  customer_id: (i.customer_id ?? null) as string | null,
  customer_email: (i.customer_email ?? null) as string | null,
  billing_name: (i.billing_name ?? null) as string | null,
  billing_address: (i.billing_address ?? null) as string | null,
  payment_url: (i.payment_url ?? null) as string | null,
  pdf_url: (i.pdf_url ?? null) as string | null,
  lines: Array.isArray(i.lines) ? (i.lines as ApiInvoiceLine[]).map(normalizeLine) : tryParse<ApiInvoiceLine[]>(i.lines).map(normalizeLine),
  due_date: i.due_date ? toIso(i.due_date) : null,
  metadata: (i.metadata ?? null) as Record<string, unknown> | null,
  updated_at: i.updated_at ? toIso(i.updated_at) : null,
});

export type ListParams = {
  q?: string; // number/customer
  status?: InvoiceStatus;
  customer_id?: string;
  created_from?: string; created_to?: string; // ISO
  due_from?: string; due_to?: string;         // ISO
  min_total?: number; max_total?: number;
  limit?: number; offset?: number;
  sort?: "created_at" | "updated_at" | "issue_date" | "due_date" | "total" | "status";
  order?: "asc" | "desc";
};

export type CreateInvoiceBody = {
  customer_id: string | null;
  customer_email?: string | null;
  billing_name?: string | null;
  billing_address?: string | null;
  currency: string;
  lines: Array<Pick<InvoiceLine, "description" | "quantity" | "unit_price"> & { product_id?: string | null; order_id?: string | null }>;
  issue_date?: string | null;
  due_date?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type UpdateInvoiceBody = Partial<Omit<CreateInvoiceBody, "currency" | "lines">> & {
  lines?: Array<Pick<InvoiceLine, "id" | "description" | "quantity" | "unit_price">>;
};

export type MarkPaidBody = { paid_total?: number | null; paid_at?: string | null; note?: string | null };
export type SendEmailBody = { to?: string | string[] | null; template?: "invoice_issued" | "payment_reminder" | "overdue_notice" | "custom"; subject?: string | null; message?: string | null };
export type PdfResponse = { url: string; expires_at: string | null };
export type ExportParams = ListParams & { format?: "csv" | "xlsx" };
export type ExportResponse = { url: string; expires_at: string | null };

export const invoicesAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listInvoicesAdmin: b.query<Invoice[], ListParams | void>({
      query: (params) => ({ url: "/invoices", params }),
      transformResponse: (res: unknown): Invoice[] => {
        if (Array.isArray(res)) return (res as ApiInvoice[]).map(normalizeInvoice);
        const maybe = res as { data?: unknown };
        return Array.isArray(maybe?.data) ? (maybe.data as ApiInvoice[]).map(normalizeInvoice) : [];
      },
      providesTags: (result) => result ? [
        ...result.map((i) => ({ type: "Invoices" as const, id: i.id })),
        { type: "Invoices" as const, id: "LIST" },
      ] : [{ type: "Invoices" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    getInvoiceAdminById: b.query<Invoice, string>({
      query: (id) => ({ url: `/invoices/${id}` }),
      transformResponse: (res: unknown): Invoice => normalizeInvoice(res as ApiInvoice),
      providesTags: (_r, _e, id) => [{ type: "Invoices", id }],
    }),

    createInvoiceAdmin: b.mutation<Invoice, CreateInvoiceBody>({
      query: (body) => ({ url: "/invoices", method: "POST", body }),
      transformResponse: (res: unknown): Invoice => normalizeInvoice(res as ApiInvoice),
      invalidatesTags: [{ type: "Invoices", id: "LIST" }],
    }),

    updateInvoiceAdmin: b.mutation<Invoice, { id: string; body: UpdateInvoiceBody }>({
      query: ({ id, body }) => ({ url: `/invoices/${id}`, method: "PATCH", body }),
      transformResponse: (res: unknown): Invoice => normalizeInvoice(res as ApiInvoice),
      invalidatesTags: (_r, _e, arg) => [{ type: "Invoices", id: arg.id }, { type: "Invoices", id: "LIST" }],
    }),

    markInvoicePaidAdmin: b.mutation<Invoice, { id: string; body?: MarkPaidBody }>({
      query: ({ id, body }) => ({ url: `/invoices/${id}/mark-paid`, method: "POST", body }),
      transformResponse: (res: unknown): Invoice => normalizeInvoice(res as ApiInvoice),
      invalidatesTags: (_r, _e, arg) => [{ type: "Invoices", id: arg.id }, { type: "Invoices", id: "LIST" }],
    }),

    sendInvoiceEmailAdmin: b.mutation<{ ok: true }, { id: string; body?: SendEmailBody }>({
      query: ({ id, body }) => ({ url: `/invoices/${id}/send-email`, method: "POST", body }),
      transformResponse: (res: unknown): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, _arg) => [{ type: "Invoices", id: "LIST" }],
    }),

    getInvoicePdfAdmin: b.mutation<PdfResponse, { id: string }>({
      query: ({ id }) => ({ url: `/invoices/${id}/pdf`, method: "GET" }),
      transformResponse: (res: unknown): PdfResponse => {
        const r = res as { url?: unknown; expires_at?: unknown };
        return { url: String(r?.url ?? ""), expires_at: r?.expires_at ? toIso(r.expires_at) : null };
      },
    }),

    exportInvoicesAdmin: b.mutation<ExportResponse, ExportParams | void>({
      query: (params) => ({ url: `/invoices/export`, method: "GET", params }),
      transformResponse: (res: unknown): ExportResponse => {
        const r = res as { url?: unknown; expires_at?: unknown };
        return { url: String(r?.url ?? ""), expires_at: r?.expires_at ? toIso(r.expires_at) : null };
      },
    }),
  }),
  overrideExisting: true,
});

export const {
  useListInvoicesAdminQuery,
  useGetInvoiceAdminByIdQuery,
  useCreateInvoiceAdminMutation,
  useUpdateInvoiceAdminMutation,
  useMarkInvoicePaidAdminMutation,
  useSendInvoiceEmailAdminMutation,
  useGetInvoicePdfAdminMutation,
  useExportInvoicesAdminMutation,
} = invoicesAdminApi;