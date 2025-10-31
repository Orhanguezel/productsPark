import { useEffect, useState } from "react";
import { metahub } from "@/integrations/metahub/client";
import type { SiteSettingRow } from "@/integrations/metahub/db/types/site";
import type { RowChange, SubscriptionResult } from "@/integrations/metahub/realtime/channel";

export const useMaintenanceMode = () => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    void checkMaintenanceMode();
    void checkAdminStatus();

    // Realtime — payload’ı tipliyoruz
    const ch = metahub
      .channel("maintenance-mode-changes")
      .on<RowChange<SiteSettingRow>>(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "site_settings",
          filter: "key=eq.maintenance_mode",
        },
        (payload) => {
          // payload.new veya payload.old olabilir
          const raw = payload?.new?.value ?? payload?.old?.value;
          const enabled =
            raw === true || raw === "true" || raw === 1 || raw === "1";
          setIsMaintenanceMode(Boolean(enabled));
        }
      );

    const subscription: Promise<SubscriptionResult> | SubscriptionResult = ch.subscribe();

    return () => {
      // removeChannel hem Promise’i hem objeyi kabul ediyor
      metahub.removeChannel(subscription);
    };
  }, []);

  async function checkAdminStatus(): Promise<void> {
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
    } catch (err) {
      console.error("Error checking admin status:", err);
      setIsAdmin(false);
    }
  }

  async function checkMaintenanceMode(): Promise<void> {
    try {
      setLoading(true);
      const { data, error } = await metahub
        .from("site_settings")
        .select("value")
        .eq("key", "maintenance_mode")
        .maybeSingle();

      if (error) throw error;

      const raw = data?.value;
      const enabled = raw === true || raw === "true" || raw === 1 || raw === "1";
      setIsMaintenanceMode(Boolean(enabled));
    } catch (err) {
      console.error("Error checking maintenance mode:", err);
      setIsMaintenanceMode(false);
    } finally {
      setLoading(false);
    }
  }

  // Admin’ler bakım modunu bypass eder
  const shouldShowMaintenance = isMaintenanceMode && !isAdmin;
  return { shouldShowMaintenance, loading };
};
