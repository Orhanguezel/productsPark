import { useEffect, useState } from "react";
import { metahub } from "@/integrations/metahub/client";

export const useMaintenanceMode = () => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkMaintenanceMode();
    checkAdminStatus();

    // Subscribe to real-time updates
    const channel = metahub
      .channel('maintenance-mode-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings',
          filter: 'key=eq.maintenance_mode'
        },
        (payload) => {
          console.log('Maintenance mode changed:', payload);
          if (payload.new && 'value' in payload.new) {
            const newValue = payload.new.value;
            setIsMaintenanceMode(newValue === true || newValue === 'true');
          }
        }
      )
      .subscribe();

    return () => {
      metahub.removeChannel(channel);
    };
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await metahub.auth.getUser();

      if (!user) {
        setIsAdmin(false);
        return;
      }

      const { data: roleData, error } = await metahub
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error) throw error;

      setIsAdmin(!!roleData);
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    }
  };

  const checkMaintenanceMode = async () => {
    try {
      setLoading(true);
      const { data, error } = await metahub
        .from("site_settings")
        .select("value")
        .eq("key", "maintenance_mode")
        .maybeSingle();

      if (error) throw error;

      const maintenanceValue = data?.value;
      // Handle both boolean and string 'true'/'false' values
      setIsMaintenanceMode(maintenanceValue === true || maintenanceValue === 'true');
    } catch (error) {
      console.error("Error checking maintenance mode:", error);
      setIsMaintenanceMode(false);
    } finally {
      setLoading(false);
    }
  };

  // Admins bypass maintenance mode
  const shouldShowMaintenance = isMaintenanceMode && !isAdmin;

  return { shouldShowMaintenance, loading };
};
