
// -------------------------------------------------------------
// FILE: src/integrations/metahub/hooks/admin/useRolesAdmin.ts
// -------------------------------------------------------------
import { useMemo, useState } from "react";
import { metahub as m } from "@/integrations/metahub/client";
import type { Role, RolesListParams, Permission } from "@/integrations/metahub/client/admin/rbac";
import { notifySuccess as ok, notifyError as fail } from "@/integrations/metahub/ui/toast/helpers";

export function useRolesAdmin(initial: RolesListParams = { limit: 50, offset: 0, sort: "created_at", order: "desc" }) {
  const [params, setParams] = useState<RolesListParams>(initial);
  const dq = m.useDebouncedValue(params.q ?? "", 300);
  const merged = useMemo(() => ({ ...params, q: dq || undefined }), [params, dq]);
  const { data, isLoading, error, refetch } = m.api.useListRolesAdminQuery(merged);
  const setPage = (page: number, size = params.limit ?? 50) => setParams((p) => ({ ...p, limit: size, offset: page * size }));
  const setFilter = (patch: Partial<RolesListParams>) => setParams((p) => ({ ...p, ...patch }));
  return { list: (data ?? []) as Role[], isLoading, error, refetch, params, setPage, setFilter };
}

export function useRoleDetail(slug: string | null) {
  const skip = !slug; const { data, isLoading } = m.api.useGetRoleAdminQuery(slug as string, { skip });
  return { item: (data ?? null) as Role | null, isLoading };
}

export function usePermissionsList() {
  const { data, isLoading, error, refetch } = m.api.useListPermissionsAdminQuery();
  return { list: (data ?? []) as Permission[], isLoading, error, refetch };
}

export function useRoleMutations() {
  const [createMut] = m.api.useCreateRoleAdminMutation();
  const [updateMut] = m.api.useUpdateRoleAdminMutation();
  const [deleteMut] = m.api.useDeleteRoleAdminMutation();
  const [setPermMut] = m.api.useSetRolePermissionsAdminMutation();

  const create = async (body: { slug: string; name: string; description?: string | null; permissions?: string[] }) => {
    try { await createMut(body).unwrap(); ok("Rol oluşturuldu"); return { ok: true as const }; }
    catch { fail("Rol oluşturulamadı"); return { ok: false as const }; }
  };
  const update = async (slug: string, body: { name?: string; description?: string | null; permissions?: string[] }) => {
    try { await updateMut({ slug, body }).unwrap(); ok("Rol güncellendi"); return { ok: true as const }; }
    catch { fail("Rol güncellenemedi"); return { ok: false as const }; }
  };
  const remove = async (slug: string) => { try { await deleteMut(slug).unwrap(); ok("Rol silindi"); return { ok: true as const }; } catch { fail("Rol silinemedi"); return { ok: false as const }; } };
  const setPermissions = async (slug: string, permissions: string[]) => { try { await setPermMut({ slug, permissions }).unwrap(); ok("İzinler güncellendi"); return { ok: true as const }; } catch { fail("İzinler güncellenemedi"); return { ok: false as const }; } };

  return { create, update, remove, setPermissions };
}
