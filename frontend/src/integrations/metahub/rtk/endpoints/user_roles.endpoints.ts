// src/integrations/metahub/rtk/endpoints/user_roles.endpoints.ts
import { baseApi as baseApi_ur } from "../baseApi";
import type { UserRoleName } from "../../db/types/users";

/** Merkezi tipe uyumlu rol atamaları */
export type RoleName = UserRoleName;

export type UserRole = {
  id: string;
  user_id: string;
  role: RoleName;
  created_at?: string;
};

type ListParams = {
  user_id?: string;
  role?: RoleName;
  /** backend: order + direction ayrı ayrı */
  order?: "created_at";
  direction?: "asc" | "desc";
  limit?: number;
  offset?: number;
};

export const userRolesApi = baseApi_ur.injectEndpoints({
  endpoints: (b) => ({
    listUserRoles: b.query<UserRole[], ListParams | void>({
      query: (params) => {
        // void | ListParams daraltması
        const p: ListParams = (params ?? {}) as ListParams;
        return {
          url: "/user_roles",
          params: {
            user_id: p.user_id,
            role: p.role,
            order: p.order ?? "created_at",
            direction: p.direction ?? "asc",
            limit: p.limit,
            offset: p.offset,
          },
        };
      },
      transformResponse: (res: unknown): UserRole[] =>
        Array.isArray(res) ? (res as UserRole[]) : [],
      providesTags: (result) =>
        result && result.length
          ? [
              ...result.map((r) => ({ type: "UserRole" as const, id: r.id })),
              { type: "UserRoles" as const, id: "LIST" },
            ]
          : [{ type: "UserRoles" as const, id: "LIST" }],
    }),

    createUserRole: b.mutation<UserRole, { user_id: string; role: RoleName }>({
      query: (body) => ({ url: "/user_roles", method: "POST", body }),
      invalidatesTags: [{ type: "UserRoles", id: "LIST" }],
    }),

    deleteUserRole: b.mutation<{ ok: true }, { id: string }>({
      query: ({ id }) => ({
        url: `/user_roles/${encodeURIComponent(id)}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "UserRoles", id: "LIST" }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListUserRolesQuery,
  useCreateUserRoleMutation,
  useDeleteUserRoleMutation,
} = userRolesApi;
