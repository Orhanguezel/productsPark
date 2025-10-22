
// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/admin/roles_admin.endpoints.ts
// -------------------------------------------------------------
import { baseApi as baseApi2 } from "../../baseApi";

const toIso2 = (x: unknown): string => new Date(x as string | number | Date).toISOString();
const tryParse2 = <T>(x: unknown): T => { if (typeof x === "string") { try { return JSON.parse(x) as T; } catch {/* ignore parse errors */}} return x as T; };

export type Permission = { key: string; name: string; group: string | null; description: string | null };
export type Role = { slug: string; name: string; description: string | null; permissions: string[]; created_at: string; updated_at: string };

export type ApiRole = Omit<Role, "permissions" | "created_at" | "updated_at"> & { permissions: string[] | string; created_at: string | number | Date; updated_at: string | number | Date };

const normalizeRole = (r: ApiRole): Role => ({
  ...r,
  permissions: Array.isArray(r.permissions) ? r.permissions.map(String) : tryParse2<string[]>(r.permissions),
  created_at: toIso2(r.created_at),
  updated_at: toIso2(r.updated_at),
});

export type RolesListParams = { q?: string; limit?: number; offset?: number; sort?: "created_at" | "name"; order?: "asc" | "desc" };
export type UpsertRoleBody = { slug: string; name: string; description?: string | null; permissions?: string[] };
export type PatchRoleBody = Partial<Omit<UpsertRoleBody, "slug">> & { permissions?: string[] };

export const rolesAdminApi = baseApi2.injectEndpoints({
  endpoints: (b) => ({
    listRolesAdmin: b.query<Role[], RolesListParams | void>({
      query: () => ({ url: "/admin/roles"}),
      transformResponse: (res: unknown): Role[] => {
        if (Array.isArray(res)) return (res as ApiRole[]).map(normalizeRole);
        const maybe = res as { data?: unknown };
        return Array.isArray(maybe?.data) ? (maybe.data as ApiRole[]).map(normalizeRole) : [];
      },
      providesTags: (result) => result ? [
        ...result.map((r) => ({ type: "Role" as const, id: r.slug })),
        { type: "Roles" as const, id: "LIST" },
      ] : [{ type: "Roles" as const, id: "LIST" }],
    }),

    getRoleAdmin: b.query<Role, string>({
      query: (slug) => ({ url: `/admin/roles/${slug}` }),
      transformResponse: (res: unknown): Role => normalizeRole(res as ApiRole),
      providesTags: (_r, _e, slug) => [{ type: "Role", id: slug }],
    }),

    createRoleAdmin: b.mutation<Role, UpsertRoleBody>({
      query: (body) => ({ url: "/admin/roles", method: "POST", body }),
      transformResponse: (res: unknown): Role => normalizeRole(res as ApiRole),
      invalidatesTags: [{ type: "Roles" as const, id: "LIST" }],
    }),

    updateRoleAdmin: b.mutation<Role, { slug: string; body: PatchRoleBody }>({
      query: ({ slug, body }) => ({ url: `/admin/roles/${slug}`, method: "PATCH", body }),
      transformResponse: (res: unknown): Role => normalizeRole(res as ApiRole),
      invalidatesTags: (_r, _e, arg) => [{ type: "Role", id: arg.slug }, { type: "Roles", id: "LIST" }],
    }),

    deleteRoleAdmin: b.mutation<{ ok: true }, string>({
      query: (slug) => ({ url: `/admin/roles/${slug}`, method: "DELETE" }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: [{ type: "Roles" as const, id: "LIST" }],
    }),

    listPermissionsAdmin: b.query<Permission[], void>({
      query: () => ({ url: "/admin/permissions" }),
      transformResponse: (res: unknown): Permission[] => {
        if (Array.isArray(res)) return (res as Permission[]).map((p) => ({ ...p, key: String(p.key), name: String(p.name), group: p.group ?? null, description: p.description ?? null }));
        const maybe = res as { data?: unknown };
        return Array.isArray(maybe?.data) ? (maybe.data as Permission[]).map((p) => ({ ...p, key: String(p.key), name: String(p.name), group: p.group ?? null, description: p.description ?? null })) : [];
      },
      providesTags: [{ type: "Permissions" as const, id: "LIST" }],
    }),

    setRolePermissionsAdmin: b.mutation<{ ok: true }, { slug: string; permissions: string[] }>({
      query: ({ slug, permissions }) => ({ url: `/admin/roles/${slug}/permissions`, method: "POST", body: { permissions } }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: (_r, _e, arg) => [{ type: "Role", id: arg.slug }, { type: "Roles", id: "LIST" }, { type: "Permissions", id: "LIST" }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListRolesAdminQuery,
  useGetRoleAdminQuery,
  useCreateRoleAdminMutation,
  useUpdateRoleAdminMutation,
  useDeleteRoleAdminMutation,
  useListPermissionsAdminQuery,
  useSetRolePermissionsAdminMutation,
} = rolesAdminApi;
