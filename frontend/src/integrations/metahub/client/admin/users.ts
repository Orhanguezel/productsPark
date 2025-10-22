
// -------------------------------------------------------------
// FILE: src/integrations/metahub/client/admin/users.ts (Facade)
// -------------------------------------------------------------
import { store } from "@/store";
import { normalizeError } from "@/integrations/metahub/core/errors";
import { usersAdminApi, type User, type UsersListParams, type InviteUserBody, type UpdateUserBody } from "@/integrations/metahub/rtk/endpoints/admin/users_admin.endpoints";

export const usersAdmin = {
  async list(params?: UsersListParams) { try { const d = await store.dispatch(usersAdminApi.endpoints.listUsersAdmin.initiate(params)).unwrap(); return { data: d as User[], error: null as null }; } catch (e) { const { message } = normalizeError(e); return { data: null as User[] | null, error: { message } }; } },
  async get(id: string) { try { const d = await store.dispatch(usersAdminApi.endpoints.getUserAdmin.initiate(id)).unwrap(); return { data: d as User, error: null as null }; } catch (e) { const { message } = normalizeError(e); return { data: null as User | null, error: { message } }; } },
  async invite(body: InviteUserBody) { try { const d = await store.dispatch(usersAdminApi.endpoints.inviteUserAdmin.initiate(body)).unwrap(); return { data: d as { ok: true; id?: string }, error: null as null }; } catch (e) { const { message } = normalizeError(e); return { data: null as { ok: true; id?: string } | null, error: { message } }; } },
  async update(id: string, body: UpdateUserBody) { try { const d = await store.dispatch(usersAdminApi.endpoints.updateUserAdmin.initiate({ id, body })).unwrap(); return { data: d as User, error: null as null }; } catch (e) { const { message } = normalizeError(e); return { data: null as User | null, error: { message } }; } },
  async setActive(id: string, is_active: boolean) { try { const d = await store.dispatch(usersAdminApi.endpoints.setUserActiveAdmin.initiate({ id, is_active })).unwrap(); return { data: d as { ok: true }, error: null as null }; } catch (e) { const { message } = normalizeError(e); return { data: null as { ok: true } | null, error: { message } }; } },
  async setRoles(id: string, roles: string[]) { try { const d = await store.dispatch(usersAdminApi.endpoints.setUserRolesAdmin.initiate({ id, roles })).unwrap(); return { data: d as { ok: true }, error: null as null }; } catch (e) { const { message } = normalizeError(e); return { data: null as { ok: true } | null, error: { message } }; } },
};

export type { User, UsersListParams };