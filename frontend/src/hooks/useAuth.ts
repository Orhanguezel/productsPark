// =============================================================
// FILE: src/hooks/useAuth.ts
// FINAL — Auth hook (admin check correct + user_id guaranteed)
// =============================================================

import type { AuthUser } from '@/integrations/types';
import {
  useAuthMeQuery,
  useStatusQuery,
  useAuthLogoutMutation,
  useListUserRolesQuery,
} from '@/integrations/hooks';

import { useDispatch } from 'react-redux';
import { baseApi } from '@/integrations/baseApi';

type UseAuthReturn = {
  user: AuthUser | null;
  session: null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
};

type AnyObj = Record<string, unknown>;

const toRoleArray = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  if (typeof v === 'string') return v.trim() ? [v.trim()] : [];
  return [];
};

const resolveUserId = (u: AuthUser | null): string | null => {
  if (!u) return null;

  // Primary
  const direct = (u as { id?: unknown }).id;
  if (typeof direct === 'string' && direct.trim()) return direct.trim();

  // Fallbacks (backend variations)
  const o = u as unknown as AnyObj;

  const userId = o.user_id;
  if (typeof userId === 'string' && userId.trim()) return userId.trim();

  const sub = o.sub;
  if (typeof sub === 'string' && sub.trim()) return sub.trim();

  return null;
};

export const useAuth = (): UseAuthReturn => {
  const dispatch = useDispatch();

  const { data: meData, isLoading: meLoading, isError: meError } = useAuthMeQuery();
  const { data: statusData, isLoading: statusLoading, isError: statusError } = useStatusQuery();
  const [logoutMutation] = useAuthLogoutMutation();

  const loading = meLoading || statusLoading;
  const hasError = meError || statusError;

  const rawUser: AuthUser | null = !hasError ? meData ?? null : null;

  const statusAuthenticated = !!statusData?.authenticated;
  const isAuthenticated = loading ? !!rawUser : statusAuthenticated && !!rawUser;

  const roles = toRoleArray((rawUser as unknown as { roles?: unknown })?.roles);
  const isAdminFromUser = roles.map((r) => r.toLowerCase()).includes('admin');

  // ✅ user_id artık garanti
  const userId = resolveUserId(rawUser);

  // ✅ fallback check: user_roles?user_id=...&role=admin&limit=1
  const { data: adminRoleRows } = useListUserRolesQuery(
    userId ? { user_id: userId, role: 'admin', limit: 1, offset: 0 } : undefined,
    {
      skip: !userId || isAdminFromUser,
      refetchOnMountOrArgChange: true,
    },
  );

  const isAdmin = isAuthenticated && (isAdminFromUser || !!adminRoleRows?.length);

  const signOut = async () => {
    try {
      await logoutMutation().unwrap();
    } catch (e) {
      console.error('Logout failed', e);
    } finally {
      dispatch(baseApi.util.resetApiState());
    }
  };

  return {
    user: isAuthenticated ? rawUser : null,
    session: null,
    loading,
    isAuthenticated,
    isAdmin,
    signOut,
  };
};
