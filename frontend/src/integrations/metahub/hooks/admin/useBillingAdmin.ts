
// -------------------------------------------------------------
// FILE: src/integrations/metahub/hooks/admin/useBillingAdmin.ts
// -------------------------------------------------------------
import { useMemo, useState } from "react";
import { metahub as m } from "@/integrations/metahub/client";
import type { PaymentAdmin, PaymentsAdminListParams, RefundAdmin, RefundsAdminListParams } from "@/integrations/metahub/client/admin/billing";
import { notifySuccess as ok, notifyError as fail } from "@/integrations/metahub/ui/toast/helpers";

export function usePaymentsAdmin(initial: PaymentsAdminListParams = { limit: 50, offset: 0, sort: "created_at", order: "desc" }) {
  const [params, setParams] = useState<PaymentsAdminListParams>(initial);
  const dq = m.useDebouncedValue(params.q ?? "", 300);
  const merged = useMemo(() => ({ ...params, q: dq || undefined }), [params, dq]);
  const { data, isLoading, error, refetch } = m.api.useListPaymentsAdminQuery(merged);
  const setPage = (page: number, size = params.limit ?? 50) => setParams((p) => ({ ...p, limit: size, offset: page * size }));
  const setFilter = (patch: Partial<PaymentsAdminListParams>) => setParams((p) => ({ ...p, ...patch }));
  return { list: (data ?? []) as PaymentAdmin[], isLoading, error, refetch, params, setPage, setFilter };
}

export function useRefundsAdmin(initial: RefundsAdminListParams = { limit: 50, offset: 0, sort: "created_at", order: "desc" }) {
  const [params, setParams] = useState<RefundsAdminListParams>(initial);
  const dq = m.useDebouncedValue(params.q ?? "", 300);
  const merged = useMemo(() => ({ ...params, q: dq || undefined }), [params, dq]);
  const { data, isLoading, error, refetch } = m.api.useListRefundsAdminQuery(merged);
  const setPage = (page: number, size = params.limit ?? 50) => setParams((p) => ({ ...p, limit: size, offset: page * size }));
  const setFilter = (patch: Partial<RefundsAdminListParams>) => setParams((p) => ({ ...p, ...patch }));
  return { list: (data ?? []) as RefundAdmin[], isLoading, error, refetch, params, setPage, setFilter };
}

export function useBillingMutations() {
  const [captureMut] = m.api.useCapturePaymentAdminMutation();
  const [voidMut] = m.api.useVoidPaymentAdminMutation();
  const [createRefundMut] = m.api.useCreateRefundAdminMutation();

  const capture = async (paymentId: string) => { try { await captureMut({ id: paymentId }).unwrap(); ok("Ödeme capture edildi"); return { ok: true as const }; } catch { fail("Capture başarısız"); return { ok: false as const }; } };
  const voidPay = async (paymentId: string) => { try { await voidMut({ id: paymentId }).unwrap(); ok("Ödeme iptal edildi"); return { ok: true as const }; } catch { fail("İptal başarısız"); return { ok: false as const }; } };
  const refund = async (paymentId: string, amount: number, reason?: string | null, metadata?: Record<string, unknown> | null) => { try { await createRefundMut({ payment_id: paymentId, amount, reason, metadata }).unwrap(); ok("İade oluşturuldu"); return { ok: true as const }; } catch { fail("İade oluşturulamadı"); return { ok: false as const }; } };

  return { capture, voidPay, refund };
}
