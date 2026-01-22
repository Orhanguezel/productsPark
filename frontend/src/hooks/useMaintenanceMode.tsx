// =============================================================
// FILE: src/hooks/useMaintenanceMode.ts
// =============================================================
import { useAuth } from "@/hooks/useAuth";
import {
  useGetSiteSettingByKeyQuery,
  useListUserRolesQuery,
} from "@/integrations/hooks";

export const useMaintenanceMode = () => {
  const { user, loading: authLoading } = useAuth();

  // 🔧 Bakım modu ayarı RTK'dan
  const {
    data: maintenanceSetting,
    isLoading: maintenanceLoading,
  } = useGetSiteSettingByKeyQuery("maintenance_mode");

  // 👮 Kullanıcının admin olup olmadığını RTK'dan al
  const {
    data: roles,
    isLoading: rolesLoading,
  } = useListUserRolesQuery(
    user
      ? {
          user_id: user.id,
          role: "admin",
          limit: 1,
        }
      : undefined,
    {
      skip: !user, // user yoksa sorguyu çalıştırma
    }
  );

  const isAdmin = !!user && !!roles && roles.length > 0;

  const raw = maintenanceSetting?.value;
  const isMaintenanceMode =
    raw === true || raw === "true" || raw === 1 || raw === "1";

  const shouldShowMaintenance = isMaintenanceMode && !isAdmin;

  const loading =
    authLoading ||
    maintenanceLoading ||
    (!!user && rolesLoading);

  return { shouldShowMaintenance, loading };
};
