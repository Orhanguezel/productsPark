import { baseApi as baseApi_ur } from "../baseApi";

export type RoleName = 'admin' | 'moderator' | 'user';

export type UserRole = {
  id: string;
  user_id: string;
  role: RoleName;
  created_at?: string;
};

type ListParams = {
  user_id?: string;
  role?: RoleName;
  limit?: number;
  offset?: number;
  order?: "created_at";
  direction?: "asc" | "desc";
};

export const userRolesApi = baseApi_ur.injectEndpoints({
  endpoints: (b) => ({
    listUserRoles: b.query<UserRole[], ListParams>({
      query: (params) => {
        const { direction, ...rest } = params ?? {};
        // BE tarafında "order=created_at.asc|desc" bekliyoruz
        const order = rest.order ? `${rest.order}.${direction === "desc" ? "desc" : "asc"}` : undefined;
        return { url: "/user_roles", params: { ...rest, order } };
      },
      transformResponse: (res: unknown): UserRole[] => Array.isArray(res) ? (res as UserRole[]) : [],
      providesTags: (result) =>
        result
          ? [
              ...result.map(r => ({ type: "UserRole" as const, id: r.id })),
              { type: "UserRoles" as const, id: "LIST" },
            ]
          : [{ type: "UserRoles" as const, id: "LIST" }],
    }),

    createUserRole: b.mutation<UserRole, { user_id: string; role: RoleName }>({
      query: (body) => ({ url: "/user_roles", method: "POST", body }),
      invalidatesTags: [{ type: "UserRoles", id: "LIST" }],
    }),

    deleteUserRole: b.mutation<{ ok: true }, { id: string }>({
      query: ({ id }) => ({ url: `/user_roles/${id}`, method: "DELETE" }),
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
