
// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/users_admin.endpoints.ts
// -------------------------------------------------------------
import { baseApi } from "../../baseApi";

const toIso = (x: unknown): string => new Date(x as string | number | Date).toISOString();
const toBool = (x: unknown): boolean => (typeof x === "boolean" ? x : Number(x as unknown) === 1);
const tryParse = <T>(x: unknown): T => { if (typeof x === "string") { try { return JSON.parse(x) as T; } catch {/* keep string */} } return x as T; };

export type User = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  is_active: boolean;
  roles: string[];              // role slugs or names
  metadata: Record<string, unknown> | null;
  created_at: string;
  last_login_at: string | null;
};

export type ApiUser = Omit<User, "is_active" | "roles" | "metadata" | "created_at" | "last_login_at"> & {
  is_active: boolean | 0 | 1 | "0" | "1";
  roles: string[] | string;           // can be JSON-string
  metadata: string | Record<string, unknown> | null;
  created_at: string | number | Date;
  last_login_at: string | number | Date | null;
};

const normalizeUser = (u: ApiUser): User => ({
  ...u,
  is_active: toBool(u.is_active),
  roles: Array.isArray(u.roles) ? u.roles.map(String) : tryParse<string[]>(u.roles),
  metadata: u.metadata == null ? null : tryParse<Record<string, unknown>>(u.metadata),
  created_at: toIso(u.created_at),
  last_login_at: u.last_login_at == null ? null : toIso(u.last_login_at),
});

export type UsersListParams = {
  q?: string;                  // name/email search
  role?: string;               // filter by role
  is_active?: boolean;         // maps to 1/0 if BE isterse
  limit?: number; offset?: number;
  sort?: "created_at" | "email" | "last_login_at"; order?: "asc" | "desc";
};

export type UpdateUserBody = Partial<Pick<User, "full_name" | "phone" | "metadata" | "is_active">> & { roles?: string[] };
export type InviteUserBody = { email: string; full_name?: string; roles?: string[] };

export const usersAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listUsersAdmin: b.query<User[], UsersListParams | void>({
      query: (params) => ({
        url: "/admin/users",
        params: params ? { ...params, is_active: params.is_active == null ? undefined : params.is_active ? 1 : 0 } : undefined,
      }),
      transformResponse: (res: unknown): User[] => {
        if (Array.isArray(res)) return (res as ApiUser[]).map(normalizeUser);
        const maybe = res as { data?: unknown };
        return Array.isArray(maybe?.data) ? (maybe.data as ApiUser[]).map(normalizeUser) : [];
      },
      providesTags: (result) => result ? [
        ...result.map((u) => ({ type: "User" as const, id: u.id })),
        { type: "Users" as const, id: "LIST" },
      ] : [{ type: "Users" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    getUserAdmin: b.query<User, string>({
      query: (id) => ({ url: `/admin/users/${id}` }),
      transformResponse: (res: unknown): User => normalizeUser(res as ApiUser),
      providesTags: (_r, _e, id) => [{ type: "User", id }],
    }),

    inviteUserAdmin: b.mutation<{ ok: true; id?: string }, InviteUserBody>({
      query: (body) => ({ url: "/admin/users/invite", method: "POST", body }),
      transformResponse: (r: unknown) => ({ ok: true as const, id: (r as { id?: unknown })?.id ? String((r as { id?: unknown }).id) : undefined }),
      invalidatesTags: [{ type: "Users" as const, id: "LIST" }],
    }),

    updateUserAdmin: b.mutation<User, { id: string; body: UpdateUserBody }>({
      query: ({ id, body }) => ({ url: `/admin/users/${id}`, method: "PATCH", body }),
      transformResponse: (res: unknown): User => normalizeUser(res as ApiUser),
      invalidatesTags: (_r, _e, arg) => [{ type: "User", id: arg.id }, { type: "Users", id: "LIST" }],
    }),

    setUserActiveAdmin: b.mutation<{ ok: true }, { id: string; is_active: boolean }>({
      query: ({ id, is_active }) => ({ url: `/admin/users/${id}/active`, method: "POST", body: { is_active: is_active ? 1 : 0 } }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: (_r, _e, arg) => [{ type: "User", id: arg.id }, { type: "Users", id: "LIST" }],
    }),

    setUserRolesAdmin: b.mutation<{ ok: true }, { id: string; roles: string[] }>({
      query: ({ id, roles }) => ({ url: `/admin/users/${id}/roles`, method: "POST", body: { roles } }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: (_r, _e, arg) => [{ type: "User", id: arg.id }, { type: "Users", id: "LIST" }, { type: "Roles", id: "LIST" }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListUsersAdminQuery,
  useGetUserAdminQuery,
  useInviteUserAdminMutation,
  useUpdateUserAdminMutation,
  useSetUserActiveAdminMutation,
  useSetUserRolesAdminMutation,
} = usersAdminApi;