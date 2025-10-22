
// -------------------------------------------------------------
// FILE: src/integrations/metahub/client/admin/rbac.ts (Facade)
// -------------------------------------------------------------
import { store as store2 } from "@/store";
import { normalizeError as nx } from "@/integrations/metahub/core/errors";
import { rolesAdminApi, type Role, type Permission, type RolesListParams, type UpsertRoleBody, type PatchRoleBody } from "@/integrations/metahub/rtk/endpoints/admin/roles_admin.endpoints";

export const rbacAdmin = {
  async listRoles(params?: RolesListParams) { try { const d = await store2.dispatch(rolesAdminApi.endpoints.listRolesAdmin.initiate(params)).unwrap(); return { data: d as Role[], error: null as null }; } catch (e) { const { message } = nx(e); return { data: null as Role[] | null, error: { message } }; } },
  async getRole(slug: string) { try { const d = await store2.dispatch(rolesAdminApi.endpoints.getRoleAdmin.initiate(slug)).unwrap(); return { data: d as Role, error: null as null }; } catch (e) { const { message } = nx(e); return { data: null as Role | null, error: { message } }; } },
  async createRole(body: UpsertRoleBody) { try { const d = await store2.dispatch(rolesAdminApi.endpoints.createRoleAdmin.initiate(body)).unwrap(); return { data: d as Role, error: null as null }; } catch (e) { const { message } = nx(e); return { data: null as Role | null, error: { message } }; } },
  async updateRole(slug: string, body: PatchRoleBody) { try { const d = await store2.dispatch(rolesAdminApi.endpoints.updateRoleAdmin.initiate({ slug, body })).unwrap(); return { data: d as Role, error: null as null }; } catch (e) { const { message } = nx(e); return { data: null as Role | null, error: { message } }; } },
  async deleteRole(slug: string) { try { await store2.dispatch(rolesAdminApi.endpoints.deleteRoleAdmin.initiate(slug)).unwrap(); return { ok: true as const }; } catch (e) { const { message } = nx(e); return { ok: false as const, error: { message } } as const; } },
  async listPermissions() { try { const d = await store2.dispatch(rolesAdminApi.endpoints.listPermissionsAdmin.initiate(undefined)).unwrap(); return { data: d as Permission[], error: null as null }; } catch (e) { const { message } = nx(e); return { data: null as Permission[] | null, error: { message } }; } },
  async setRolePermissions(slug: string, permissions: string[]) { try { const d = await store2.dispatch(rolesAdminApi.endpoints.setRolePermissionsAdmin.initiate({ slug, permissions })).unwrap(); return { data: d as { ok: true }, error: null as null }; } catch (e) { const { message } = nx(e); return { data: null as { ok: true } | null, error: { message } }; } },
};

export type { Role, Permission, RolesListParams };
