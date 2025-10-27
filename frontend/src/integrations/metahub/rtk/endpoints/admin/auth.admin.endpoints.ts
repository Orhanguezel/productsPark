import { baseApi } from "../../baseApi";

/* ---- Admin DTO'lar ---- */
export type AdminUser = {
  id: string;
  email: string | null;
  full_name?: string | null;
  created_at?: string;
  roles?: Array<"admin" | "moderator" | "user">;
};

export type AdminUsersList = AdminUser[];

export type AdminGrantRoleBody = {
  user_id: string;
  role: "admin" | "moderator" | "user";
};

export type AdminRevokeRoleBody = {
  user_id: string;
  role: "admin" | "moderator" | "user";
};

export type AdminMakeByEmailBody = {
  email: string;
};

/* -----------------------------
 * Admin Endpoints
 * ----------------------------- */
export const authAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /** Admin: kullanıcı listesi */
    adminList: b.query<AdminUsersList, void>({
      query: () => ({ url: "/auth/v1/admin/users", method: "GET" }),
      providesTags: ["AdminUsers", "UserRoles"],
    }),

    /** Admin: tek kullanıcıyı getir */
    adminGet: b.query<AdminUser, { id: string }>({
      query: ({ id }) => ({
        url: `/auth/v1/admin/users/${encodeURIComponent(id)}`,
        method: "GET",
      }),
      providesTags: (_r, _e, arg) => [{ type: "AdminUsers", id: arg.id }, "UserRoles"],
    }),

    /** Admin: role ver (grant) */
    adminGrantRole: b.mutation<{ ok: true }, AdminGrantRoleBody>({
      query: (body) => ({ url: "/auth/v1/admin/roles", method: "POST", body }),
      invalidatesTags: ["AdminUsers", "UserRoles", "User"],
    }),

    /** Admin: role geri al (revoke) — DELETE body ile */
    adminRevokeRole: b.mutation<{ ok: true }, AdminRevokeRoleBody>({
      query: (body) => ({ url: "/auth/v1/admin/roles", method: "DELETE", body }),
      invalidatesTags: ["AdminUsers", "UserRoles", "User"],
    }),

    /** Admin: email ile admin yap */
    adminMakeByEmail: b.mutation<{ ok: true }, AdminMakeByEmailBody>({
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
