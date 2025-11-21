// =============================================================
// FILE: src/hooks/useAuth.ts
// =============================================================

import type { User } from "@/integrations/metahub/rtk/types/users";

import {
  useGetSessionQuery,
  useStatusQuery,
  useLogoutMutation,
} from "@/integrations/metahub/rtk/endpoints/auth.endpoints";

type UseAuthReturn = {
  user: User | null;
  session: null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
};

export const useAuth = (): UseAuthReturn => {
  // /auth/user -> { user }
  const {
    data: meData,
    isLoading: meLoading,
    isError: meError,
  } = useGetSessionQuery();

  // /auth/status -> { authenticated, is_admin, user? }
  const {
    data: statusData,
    isLoading: statusLoading,
    isError: statusError,
  } = useStatusQuery();

  const [logoutMutation] = useLogoutMutation();

  const loading = meLoading || statusLoading;
  const hasError = meError || statusError;

  // meData?.user zaten core/types.User tipinde → ekstra cast'e gerek yok
  const user: User | null =
    !hasError && meData?.user ? meData.user : null;

  const isAuthenticated = !!statusData?.authenticated && !!user;
  const isAdmin = !!statusData?.is_admin;

  const signOut = async () => {
    try {
      await logoutMutation().unwrap();
      // Cookie temizlenince sonraki /auth/user & /auth/status anonim dönecek
    } catch (e) {
      console.error("Logout failed", e);
      // İstersen burada toast vs atabilirsin
    }
  };

  return {
    user: isAuthenticated ? user : null,
    session: null,
    loading,
    isAuthenticated,
    isAdmin,
    signOut,
  };
};
