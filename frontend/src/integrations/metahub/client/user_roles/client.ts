import { store } from "@/store";
import {
  userRolesApi,
  type UserRole,
  type RoleName,
} from "@/integrations/metahub/rtk/endpoints/user_roles.endpoints";
import { normalizeError } from "@/integrations/metahub/core/errors";

export type { UserRole, RoleName };

export const user_roles = {
  async list(params?: { user_id?: string; role?: RoleName; limit?: number; offset?: number; direction?: "asc" | "desc" }) {
    try {
      const data = await store.dispatch(
        userRolesApi.endpoints.listUserRoles.initiate({ ...params, order: "created_at" })
      ).unwrap();
      return { data, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as UserRole[] | null, error: { message } };
    }
  },

  /** FE kullanımını kolaylaştır: */
  async isAdmin(user_id: string) {
    const r = await this.list({ user_id, role: "admin", limit: 1 });
    return !!(r.data && r.data.length > 0);
  },

  async addRole(user_id: string, role: RoleName) {
    try {
      const data = await store.dispatch(
        userRolesApi.endpoints.createUserRole.initiate({ user_id, role })
      ).unwrap();
      return { data, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as UserRole | null, error: { message } };
    }
  },

  async removeRole(id: string) {
    try {
      await store.dispatch(
        userRolesApi.endpoints.deleteUserRole.initiate({ id })
      ).unwrap();
      return { ok: true as const, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { ok: false as const, error: { message } };
    }
  },
};
