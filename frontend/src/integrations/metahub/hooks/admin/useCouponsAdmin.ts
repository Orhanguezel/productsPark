
// -------------------------------------------------------------
// FILE: src/integrations/metahub/hooks/admin/useCouponsAdmin.ts
// -------------------------------------------------------------
import { useCallback, useMemo, useState } from "react";
import { metahub } from "@/integrations/metahub/client";
import type { Coupon, CouponListParams, CreateCouponBody, UpdateCouponBody, CouponUsage, CouponStats, CouponsExportParams, ExportResponse } from "@/integrations/metahub/client/admin/coupons";
import { notifyError, notifySuccess } from "@/integrations/metahub/ui/toast/helpers";

export function useCouponsAdmin(initial: CouponListParams = { limit: 20, offset: 0, sort: "created_at", order: "desc" }) {
  const [params, setParams] = useState<CouponListParams>(initial);
  const q = metahub.useDebouncedValue(params.q ?? "", 300);
  const merged = useMemo(() => ({ ...params, q: q || undefined }), [params, q]);

  const { data, isLoading, error, refetch } = metahub.api.useListCouponsAdminQuery(merged);

  const setPage = (page: number, size = params.limit ?? 20) => setParams((p) => ({ ...p, limit: size, offset: page * size }));
  const setSort = (sort: NonNullable<CouponListParams["sort"]>, order: NonNullable<CouponListParams["order"]>) => setParams((p) => ({ ...p, sort, order }));
  const setFilter = (patch: Partial<CouponListParams>) => setParams((p) => ({ ...p, ...patch }));

  return { list: data ?? [], isLoading, error, refetch, params, setPage, setSort, setFilter };
}

export function useCouponDetail(id: string | null) {
  const skip = !id;
  const { data, isLoading, error, refetch } = metahub.api.useGetCouponAdminByIdQuery(id as string, { skip });
  const { data: usage } = metahub.api.useListCouponUsageAdminQuery(id ? { id } : { id: "" }, { skip });
  const { data: stats } = metahub.api.useCouponStatsAdminQuery(id as string, { skip });
  return { coupon: data ?? null, usage: (usage ?? []) as CouponUsage[], stats: stats ?? null, isLoading, error, refetch };
}

export function useCreateCoupon() {
  const [mut] = metahub.api.useCreateCouponAdminMutation();
  const create = useCallback(async (body: CreateCouponBody) => {
    try { await mut(body).unwrap(); notifySuccess("Kupon oluşturuldu"); return { ok: true as const }; }
    catch (e) { notifyError("Kupon oluşturulamadı", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { create };
}

export function useUpdateCoupon() {
  const [mut] = metahub.api.useUpdateCouponAdminMutation();
  const update = useCallback(async (id: string, body: UpdateCouponBody) => {
    try { await mut({ id, body }).unwrap(); notifySuccess("Kupon güncellendi"); return { ok: true as const }; }
    catch (e) { notifyError("Kupon güncellenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { update };
}

export function useToggleCoupon() {
  const [mut] = metahub.api.useToggleCouponAdminMutation();
  const toggle = useCallback(async (id: string, active: boolean) => {
    try { await mut({ id, active }).unwrap(); notifySuccess(active ? "Kupon aktifleştirildi" : "Kupon pasifleştirildi"); return { ok: true as const }; }
    catch (e) { notifyError("İşlem başarısız", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { toggle };
}

export function useDeleteCoupon() {
  const [mut] = metahub.api.useDeleteCouponAdminMutation();
  const remove = useCallback(async (id: string) => {
    try { await mut(id).unwrap(); notifySuccess("Kupon silindi"); return { ok: true as const }; }
    catch (e) { notifyError("Kupon silinemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { remove };
}

export function useExportCoupons() {
  const [mut] = metahub.api.useExportCouponsAdminMutation();
  const exportFile = useCallback(async (params?: CouponsExportParams): Promise<ExportResponse | null> => {
    try { const res = await mut(params).unwrap(); notifySuccess("Dışa aktarma hazır"); return res; }
    catch (e) { notifyError("Dışa aktarma başarısız", undefined, e instanceof Error ? e.message : String(e)); return null; }
  }, [mut]);
  return { exportFile };
}
