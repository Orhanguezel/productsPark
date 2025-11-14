// =============================================================
// FILE: src/hooks/useAuth.ts
// =============================================================
import type { User, Session } from "@/integrations/metahub/core/types";
import {
  useGetSessionQuery,
  useStatusQuery,
  useLogoutMutation,
} from "@/integrations/metahub/rtk/endpoints/auth.endpoints";

type UseAuthReturn = {
  user: User | null;
  session: Session | null;         // RTK ile gerçek "session" yok, her zaman null
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
};

export const useAuth = (): UseAuthReturn => {
  // /auth/v1/user -> { user }
  const {
    data: meData,
    isLoading: meLoading,
    isError: meError,
  } = useGetSessionQuery();

  // /auth/v1/status -> { authenticated, is_admin, user? }
  const {
    data: statusData,
    isLoading: statusLoading,
    isError: statusError,
  } = useStatusQuery();

  const [logoutMutation] = useLogoutMutation();

  const loading = meLoading || statusLoading;
  const hasError = meError || statusError;

  const user: User | null =
    !hasError && meData?.user ? (meData.user as User) : null;

  const isAuthenticated = !!statusData?.authenticated && !!user;
  const isAdmin = !!statusData?.is_admin;

  const signOut = async () => {
    try {
      await logoutMutation().unwrap();
    } catch (e) {
      // Sessizlikle yut – FE tarafında ekstra toast istersen burada tetiklersin
      console.error("Logout failed", e);
    }
  };

  return {
    user: isAuthenticated ? user : null,
    session: null, // Supabase session yok; interface kırılmasın diye hep null
    loading,
    isAuthenticated,
    isAdmin,
    signOut,
  };
};
