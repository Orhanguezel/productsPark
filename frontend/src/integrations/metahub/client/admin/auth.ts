import { store } from "@/store";
import {
  authAdminApi,
  type AdminUser,
  type AdminUsersList,
  type AdminGrantRoleBody,
  type AdminRevokeRoleBody,
  type AdminMakeByEmailBody,
} from "@/integrations/metahub/rtk/endpoints/admin/auth.admin.endpoints";
import { normalizeError } from "@/integrations/metahub/core/errors";

export const authAdmin = {
  async listUsers(): Promise<{ data: AdminUsersList | null; error: { message: string } | null }> {
    try {
      const data = (await store.dispatch(authAdminApi.endpoints.adminList.initiate()).unwrap()) as AdminUsersList;
      return { data, error: null };
    } catch (e: unknown) {
      const { message } = normalizeError(e);
      return { data: null, error: { message } };
    }
  },

  async getUser(id: string): Promise<{ data: AdminUser | null; error: { message: string } | null }> {
    try {
      const data = (await store.dispatch(authAdminApi.endpoints.adminGet.initiate({ id })).unwrap()) as AdminUser;
      return { data, error: null };
    } catch (e: unknown) {
      const { message } = normalizeError(e);
      return { data: null, error: { message } };
    }
  },

  async grantRole(body: AdminGrantRoleBody): Promise<{ error: { message: string } | null }> {
    try {
      await store.dispatch(authAdminApi.endpoints.adminGrantRole.initiate(body)).unwrap();
      return { error: null };
    } catch (e: unknown) {
      const { message } = normalizeError(e);
      return { error: { message } };
    }
  },

  async revokeRole(body: AdminRevokeRoleBody): Promise<{ error: { message: string } | null }> {
    try {
      await store.dispatch(authAdminApi.endpoints.adminRevokeRole.initiate(body)).unwrap();
      return { error: null };
    } catch (e: unknown) {
      const { message } = normalizeError(e);
      return { error: { message } };
    }
  },

  async makeAdminByEmail(email: string): Promise<{ error: { message: string } | null }> {
    try {
      await store.dispatch(authAdminApi.endpoints.adminMakeByEmail.initiate({ email } as AdminMakeByEmailBody)).unwrap();
      return { error: null };
    } catch (e: unknown) {
      const { message } = normalizeError(e);
      return { error: { message } };
    }
  },
};

export type {
  AdminUser,
  AdminUsersList,
  AdminGrantRoleBody,
  AdminRevokeRoleBody,
  AdminMakeByEmailBody,
};
