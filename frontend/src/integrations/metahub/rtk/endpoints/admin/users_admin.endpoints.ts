// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/admin/users_admin.endpoints.ts
// -------------------------------------------------------------
import { baseApi } from "../../baseApi";
import type {
  UserRoleName,
  AdminUserRaw as CentralAdminUserRaw, // referans için; list dönüşü buna yakın
} from "../../../db/types/users";

/* ---------- helpers (type-safe) ---------- */
const toIso = (x: unknown): string => new Date(x as string | number | Date).toISOString();
const toBool = (x: unknown): boolean =>
  typeof x === "boolean" ? x : Number(x as unknown) === 1;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const tryParse = <T>(x: unknown): T => {
  if (typeof x === "string") {
    try {
      return JSON.parse(x) as T;
    } catch {
      /* keep original */
    }
  }
  return x as T;
};

const toRoleName = (v: unknown): UserRoleName | null => {
  const s = String(v ?? "").toLowerCase();
  return s === "admin" || s === "moderator" || s === "user" ? (s as UserRoleName) : null;
};

/* ---------- Types ---------- */
/** FE’nin ihtiyaç duyduğu normalize edilmiş kullanıcı görünümü */
export type User = {
  id: string;
  email: string;                 // BE pratikte dolu; istersen string | null yapabilirsin
  full_name: string | null;
  phone: string | null;
  is_active: boolean;
  roles: UserRoleName[];         // merkez role tipi
  metadata: Record<string, unknown> | null;
  created_at: string;
  last_login_at: string | null;
};

/** BE’den gelebilecek ham alanların birleşimi (tümü tiplendi, any yok) */
export type ApiUser = {
  id: string | number;
  email?: string | null;
  full_name?: string | null;
  phone?: string | null;

  is_active: boolean | 0 | 1 | "0" | "1";

  // BE bazı listelerde tekil role, bazılarında roles döndürebilir
  role?: UserRoleName | string | null;
  roles?: Array<UserRoleName | string> | string | null;

  metadata?: string | Record<string, unknown> | null;

  created_at: string | number | Date;

  // bazı endpoint’ler last_login_at, bazıları last_sign_in_at kullanabilir
  last_login_at?: string | number | Date | null;
  last_sign_in_at?: string | number | Date | null;
};

/* ---------- Normalizer (no any) ---------- */
const normalizeUser = (u: ApiUser): User => {
  // roles normalizasyonu
  let roles: UserRoleName[] = [];
  if (Array.isArray(u.roles)) {
    roles = u.roles.map(toRoleName).filter(Boolean) as UserRoleName[];
  } else if (typeof u.roles === "string") {
    // JSON string olma ihtimali
    const parsed = tryParse<Array<string>>(u.roles);
    if (Array.isArray(parsed)) {
      roles = parsed.map(toRoleName).filter(Boolean) as UserRoleName[];
    } else {
      const single = toRoleName(parsed);
      if (single) roles = [single];
    }
  } else if (u.role) {
    const single = toRoleName(u.role);
    if (single) roles = [single];
  }

  // metadata güvenli parse
  const metadata =
    u.metadata == null
      ? null
      : (isRecord(u.metadata) ? (u.metadata as Record<string, unknown>) : tryParse<Record<string, unknown>>(u.metadata));

  // last_login_at alanı birden fazla isimle gelebilir
  const lastRaw = u.last_login_at ?? u.last_sign_in_at ?? null;

  return {
    id: String(u.id),
    email: String(u.email ?? ""),
    full_name: u.full_name ?? null,
    phone: u.phone ?? null,
    is_active: toBool(u.is_active),
    roles,
    metadata,
    created_at: toIso(u.created_at),
    last_login_at: lastRaw == null ? null : toIso(lastRaw),
  };
};

/* ---------- Queries/Mutations ---------- */
export type UsersListParams = {
  q?: string;
  role?: UserRoleName | string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
  sort?: "created_at" | "email" | "last_login_at";
  order?: "asc" | "desc";
};

export type UpdateUserBody = Partial<
  Pick<User, "full_name" | "phone" | "metadata" | "is_active">
> & { roles?: UserRoleName[] };

export type InviteUserBody = { email: string; full_name?: string; roles?: UserRoleName[] };

export const usersAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listUsersAdmin: b.query<User[], UsersListParams | void>({
      query: (params) => ({
        url: "/admin/users",
        params: params
          ? {
              ...params,
              is_active:
                params.is_active == null ? undefined : params.is_active ? 1 : 0,
            }
          : undefined,
      }),
      transformResponse: (res: unknown): User[] => {
        // BE bazen direkt dizi döner, bazen { data } sarmalar
        if (Array.isArray(res)) return (res as ApiUser[]).map(normalizeUser);
        if (isRecord(res) && Array.isArray(res.data))
          return (res.data as ApiUser[]).map(normalizeUser);
        return [];
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((u) => ({ type: "User" as const, id: u.id })),
              { type: "Users" as const, id: "LIST" },
            ]
          : [{ type: "Users" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    getUserAdmin: b.query<User, string>({
      query: (id) => ({ url: `/admin/users/${encodeURIComponent(id)}` }),
      transformResponse: (res: unknown): User => normalizeUser(res as ApiUser),
      providesTags: (_r, _e, id) => [{ type: "User", id }],
    }),

    // (opsiyonel) Davet akışı varsa kullan
    inviteUserAdmin: b.mutation<{ ok: true; id?: string }, InviteUserBody>({
      query: (body) => ({ url: "/admin/users/invite", method: "POST", body }),
      transformResponse: (r: unknown) => {
        const rec = isRecord(r) ? (r as Record<string, unknown>) : {};
        const id = rec.id != null ? String(rec.id) : undefined;
        return { ok: true as const, id };
      },
      invalidatesTags: [{ type: "Users" as const, id: "LIST" }],
    }),

    updateUserAdmin: b.mutation<User, { id: string; body: UpdateUserBody }>({
      query: ({ id, body }) => ({
        url: `/admin/users/${encodeURIComponent(id)}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (res: unknown): User => normalizeUser(res as ApiUser),
      invalidatesTags: (_r, _e, arg) => [
        { type: "User", id: arg.id },
        { type: "Users", id: "LIST" },
      ],
    }),

    setUserActiveAdmin: b.mutation<{ ok: true }, { id: string; is_active: boolean }>({
      query: ({ id, is_active }) => ({
        url: `/admin/users/${encodeURIComponent(id)}/active`,
        method: "POST",
        body: { is_active: is_active ? 1 : 0 },
      }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "User", id: arg.id },
        { type: "Users", id: "LIST" },
      ],
    }),

    setUserRolesAdmin: b.mutation<{ ok: true }, { id: string; roles: UserRoleName[] }>({
      query: ({ id, roles }) => ({
        url: `/admin/users/${encodeURIComponent(id)}/roles`,
        method: "POST",
        body: { roles },
      }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "User", id: arg.id },
        { type: "Users", id: "LIST" },
        { type: "Roles", id: "LIST" },
      ],
    }),

    deleteUserAdmin: b.mutation<{ ok: true }, { id: string }>({
      query: ({ id }) => ({
        url: `/admin/users/${encodeURIComponent(id)}`,
        method: "DELETE",
      }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "User", id: arg.id },
        { type: "Users", id: "LIST" },
        { type: "AdminUsers", id: arg.id },
      ],
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
  useDeleteUserAdminMutation,
} = usersAdminApi;
