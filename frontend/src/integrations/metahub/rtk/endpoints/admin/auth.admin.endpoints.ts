// src/integrations/metahub/rtk/endpoints/admin/auth.admin.endpoints.ts
import { baseApi } from "../../baseApi";
import type { AdminUserRaw, AdminUserView, UserRoleName } from "@/integrations/metahub/db/types/users";

const asRole = (v: unknown): UserRoleName | null => {
  const s = String(v ?? "").toLowerCase();
  return s === "admin" || s === "moderator" || s === "user" ? (s as UserRoleName) : null;
};

const coerceRoles = (raw: AdminUserRaw): UserRoleName[] => {
  // 1) Tekil role geldiyse
  if (raw.role) {
    const r = asRole(raw.role);
    return r ? [r] : [];
  }
  // 2) roles dizi/string geldiyse
  const src = raw.roles;
  if (Array.isArray(src)) {
    return src.map(asRole).filter(Boolean) as UserRoleName[];
  }
  if (typeof src === "string" && src.trim()) {
    // JSON string olabilir ya da tek bir değer olabilir
    try {
      const parsed = JSON.parse(src);
      if (Array.isArray(parsed)) return parsed.map(asRole).filter(Boolean) as UserRoleName[];
      const single = asRole(parsed);
      if (single) return [single];
    } catch {
      const single = asRole(src);
      if (single) return [single];
    }
  }
  return [];
};

const normalizeAdminUser = (u: AdminUserRaw): AdminUserView => ({
  id: String(u.id),
  email: u.email ?? null,
  full_name: u.full_name ?? null,
  created_at: u.created_at ?? null,
  roles: coerceRoles(u),
});

export const authAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /** Admin: kullanıcı listesi */
    adminList: b.query<AdminUserView[], void>({
      query: () => ({ url: "/auth/v1/admin/users", method: "GET" }),
      transformResponse: (res: unknown): AdminUserView[] => {
        if (Array.isArray(res)) return (res as AdminUserRaw[]).map(normalizeAdminUser);
        const maybe = res as { data?: unknown };
        return Array.isArray(maybe?.data) ? (maybe.data as AdminUserRaw[]).map(normalizeAdminUser) : [];
      },
      providesTags: ["AdminUsers", "UserRoles"],
    }),

    /** Admin: tek kullanıcıyı getir */
    adminGet: b.query<AdminUserView, { id: string }>({
      query: ({ id }) => ({ url: `/auth/v1/admin/users/${encodeURIComponent(id)}`, method: "GET" }),
      transformResponse: (res: unknown): AdminUserView => normalizeAdminUser(res as AdminUserRaw),
      providesTags: (_r, _e, arg) => [{ type: "AdminUsers", id: arg.id }, "UserRoles"],
    }),

    /** Admin: role ver (grant) */
    adminGrantRole: b.mutation<{ ok: true }, { user_id: string; role: UserRoleName }>({
      query: (body) => ({ url: "/auth/v1/admin/roles", method: "POST", body }),
      invalidatesTags: ["AdminUsers", "UserRoles", "User"],
    }),

    /** Admin: role geri al (revoke) — DELETE body ile */
    adminRevokeRole: b.mutation<{ ok: true }, { user_id: string; role: UserRoleName }>({
      query: (body) => ({ url: "/auth/v1/admin/roles", method: "DELETE", body }),
      invalidatesTags: ["AdminUsers", "UserRoles", "User"],
    }),

    /** Admin: email ile admin yap */
    adminMakeByEmail: b.mutation<{ ok: true }, { email: string }>({
      query: (body) => ({ url: "/auth/v1/admin/make-admin", method: "POST", body }),
      invalidatesTags: ["AdminUsers", "UserRoles", "User"],
    }),
  }),
  overrideExisting: true,
});

export const {
  useAdminListQuery,
  useAdminGetQuery,
  useAdminGrantRoleMutation,
  useAdminRevokeRoleMutation,
  useAdminMakeByEmailMutation,
} = authAdminApi;
