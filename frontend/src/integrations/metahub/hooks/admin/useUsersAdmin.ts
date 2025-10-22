

// -------------------------------------------------------------
// FILE: src/integrations/metahub/hooks/admin/useUsersAdmin.ts
// -------------------------------------------------------------
import { useMemo, useState } from "react";
import { metahub } from "@/integrations/metahub/client";
import type { User, UsersListParams } from "@/integrations/metahub/client/admin/users";
import { notifySuccess, notifyError } from "@/integrations/metahub/ui/toast/helpers";

export function useUsersAdmin(initial: UsersListParams = { limit: 50, offset: 0, sort: "created_at", order: "desc" }) {
  const [params, setParams] = useState<UsersListParams>(initial);
  const dq = metahub.useDebouncedValue(params.q ?? "", 300);
  const merged = useMemo(() => ({ ...params, q: dq || undefined }), [params, dq]);
  const { data, isLoading, error, refetch } = metahub.api.useListUsersAdminQuery(merged);
  const setPage = (page: number, size = params.limit ?? 50) => setParams((p) => ({ ...p, limit: size, offset: page * size }));
  const setFilter = (patch: Partial<UsersListParams>) => setParams((p) => ({ ...p, ...patch }));
  return { list: (data ?? []) as User[], isLoading, error, refetch, params, setPage, setFilter };
}

export function useUserMutations() {
  const [inviteMut] = metahub.api.useInviteUserAdminMutation();
  const [updateMut] = metahub.api.useUpdateUserAdminMutation();
  const [activeMut] = metahub.api.useSetUserActiveAdminMutation();
  const [rolesMut]  = metahub.api.useSetUserRolesAdminMutation();

  const invite = async (email: string, full_name?: string, roles?: string[]) => {
    try { await inviteMut({ email, full_name, roles }).unwrap(); notifySuccess("Davet gönderildi"); return { ok: true as const }; }
    catch (e) { notifyError("Davet başarısız"); return { ok: false as const }; }
  };
  const update = async (id: string, body: { full_name?: string; phone?: string; metadata?: Record<string, unknown> | null; is_active?: boolean; roles?: string[] }) => {
    try { await updateMut({ id, body }).unwrap(); notifySuccess("Kullanıcı güncellendi"); return { ok: true as const }; }
    catch { notifyError("Güncelleme başarısız"); return { ok: false as const }; }
  };
  const setActive = async (id: string, is_active: boolean) => {
    try { await activeMut({ id, is_active }).unwrap(); notifySuccess(is_active ? "Aktifleştirildi" : "Devre dışı" ); return { ok: true as const }; }
    catch { notifyError("Durum değiştirilemedi"); return { ok: false as const }; }
  };
  const setRoles = async (id: string, roles: string[]) => {
    try { await rolesMut({ id, roles }).unwrap(); notifySuccess("Roller güncellendi"); return { ok: true as const }; }
    catch { notifyError("Roller güncellenemedi"); return { ok: false as const }; }
  };

  return { invite, update, setActive, setRoles };
}