// -------------------------------------------------------------
// FILE: src/integrations/metahub/client/admin/billing.ts (Facade)
// -------------------------------------------------------------
import { store } from "@/store";
import { normalizeError } from "@/integrations/metahub/core/errors";

import {
  paymentsAdminApi,
  type PaymentAdmin,
  type ListParams as PaymentListParams,
  type PaymentEvent,
} from "@/integrations/metahub/rtk/endpoints/admin/payments_admin.endpoints";

import {
  refundsAdminApi,
  type Refund,
  type RefundListParams,
  type ExportParams as RefundExportParams,
  type ExportResponse as RefundExportResponse,
} from "@/integrations/metahub/rtk/endpoints/admin/refunds_admin.endpoints";

export const billingAdmin = {
  // ----------------------
  // PAYMENTS
  // ----------------------
  async listPayments(params?: PaymentListParams) {
    try {
      const data = await store
        .dispatch(paymentsAdminApi.endpoints.listPaymentsAdmin.initiate(params))
        .unwrap();
      return { data: data as PaymentAdmin[], error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as PaymentAdmin[] | null, error: { message } };
    }
  },

  async getPaymentById(id: string) {
    try {
      const data = await store
        .dispatch(paymentsAdminApi.endpoints.getPaymentAdminById.initiate(id))
        .unwrap();
      return { data: data as PaymentAdmin, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as PaymentAdmin | null, error: { message } };
    }
  },

  async capturePayment(id: string, body?: { amount?: number | null; idempotency_key?: string | null }) {
    try {
      const data = await store
        .dispatch(paymentsAdminApi.endpoints.capturePaymentAdmin.initiate({ id, body }))
        .unwrap();
      return { data: data as PaymentAdmin, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as PaymentAdmin | null, error: { message } };
    }
  },

  async refundPayment(id: string, body?: { amount?: number | null; reason?: string | null }) {
    try {
      const data = await store
        .dispatch(paymentsAdminApi.endpoints.refundPaymentAdmin.initiate({ id, body }))
        .unwrap();
      return { data: data as PaymentAdmin, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as PaymentAdmin | null, error: { message } };
    }
  },

  async voidPayment(id: string, body?: { reason?: string | null }) {
    try {
      const data = await store
        .dispatch(paymentsAdminApi.endpoints.voidPaymentAdmin.initiate({ id, body }))
        .unwrap();
      return { data: data as PaymentAdmin, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as PaymentAdmin | null, error: { message } };
    }
  },

  async syncPayment(id: string) {
    try {
      const data = await store
        .dispatch(paymentsAdminApi.endpoints.syncPaymentAdmin.initiate(id))
        .unwrap();
      return { data: data as PaymentAdmin, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as PaymentAdmin | null, error: { message } };
    }
  },

  async listPaymentEvents(id: string) {
    try {
      const data = await store
        .dispatch(paymentsAdminApi.endpoints.listPaymentEventsAdmin.initiate(id))
        .unwrap();
      return { data: data as PaymentEvent[], error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as PaymentEvent[] | null, error: { message } };
    }
  },

  // ----------------------
  // REFUNDS
  // ----------------------
  async listRefunds(params?: RefundListParams) {
    try {
      const data = await store
        .dispatch(refundsAdminApi.endpoints.listRefundsAdmin.initiate(params))
        .unwrap();
      return { data: data as Refund[], error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as Refund[] | null, error: { message } };
    }
  },

  async getRefundById(id: string) {
    try {
      const data = await store
        .dispatch(refundsAdminApi.endpoints.getRefundAdminById.initiate(id))
        .unwrap();
      return { data: data as Refund, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as Refund | null, error: { message } };
    }
  },

  async approveRefund(id: string, body?: { admin_note?: string | null }) {
    try {
      const data = await store
        .dispatch(refundsAdminApi.endpoints.approveRefundAdmin.initiate({ id, body }))
        .unwrap();
      return { data: data as Refund, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as Refund | null, error: { message } };
    }
  },

  async rejectRefund(id: string, body: { reason: string; admin_note?: string | null }) {
    try {
      const data = await store
        .dispatch(refundsAdminApi.endpoints.rejectRefundAdmin.initiate({ id, body }))
        .unwrap();
      return { data: data as Refund, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as Refund | null, error: { message } };
    }
  },

  async completeRefund(id: string, body?: { completed_at?: string | null; external_id?: string | null; admin_note?: string | null }) {
    try {
      const data = await store
        .dispatch(refundsAdminApi.endpoints.completeRefundAdmin.initiate({ id, body }))
        .unwrap();
      return { data: data as Refund, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as Refund | null, error: { message } };
    }
  },

  async cancelRefund(id: string) {
    try {
      const data = await store
        .dispatch(refundsAdminApi.endpoints.cancelRefundAdmin.initiate(id))
        .unwrap();
      return { data: data as Refund, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as Refund | null, error: { message } };
    }
  },

  async openChargeback(id: string, body?: { external_dispute_id?: string | null; message?: string | null }) {
    try {
      const data = await store
        .dispatch(refundsAdminApi.endpoints.openChargebackAdmin.initiate({ id, body }))
        .unwrap();
      return { data: data as Refund, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as Refund | null, error: { message } };
    }
  },

  async resolveChargeback(id: string, body: { outcome: "won" | "lost" | "reversed"; admin_note?: string | null }) {
    try {
      const data = await store
        .dispatch(refundsAdminApi.endpoints.resolveChargebackAdmin.initiate({ id, body }))
        .unwrap();
      return { data: data as Refund, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as Refund | null, error: { message } };
    }
  },

  async listRefundEvents(id: string, opts?: { limit?: number; offset?: number }) {
    try {
      const data = await store
        .dispatch(refundsAdminApi.endpoints.listRefundEventsAdmin.initiate({ id, limit: opts?.limit, offset: opts?.offset }))
        .unwrap();
      return { data, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as { id: string; refund_id: string }[] | null, error: { message } };
    }
  },

  async exportRefunds(params?: RefundExportParams) {
    try {
      const data = await store
        .dispatch(refundsAdminApi.endpoints.exportRefundsAdmin.initiate(params))
        .unwrap();
      return { data: data as RefundExportResponse, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as RefundExportResponse | null, error: { message } };
    }
  },
};

export type {
  PaymentAdmin,
  PaymentListParams,
  Refund,
  RefundListParams,
  RefundExportParams,
  RefundExportResponse,
};
