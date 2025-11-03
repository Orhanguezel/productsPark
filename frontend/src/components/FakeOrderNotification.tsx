// src/components/FakeOrderNotification.tsx
import { useEffect } from "react";
import { toast } from "sonner";
import { ShoppingBag } from "lucide-react";
import {
  useGetPublicFakeNotificationSettingsQuery,   // ⬅️ değişti
  useListPublicFakeOrdersQuery,
  useGetPublicRandomFakeOrderQuery,
} from "@/integrations/metahub/rtk/endpoints/fake_notifications.endpoints";
import type { FakeOrderNotification } from "@/integrations/metahub/db/types/fakeNotifications";

export function FakeOrderNotification() {
  const { data: settings } = useGetPublicFakeNotificationSettingsQuery(); // ⬅️ değişti
  const { data: pool } = useListPublicFakeOrdersQuery();
  const { data: firstRandom } = useGetPublicRandomFakeOrderQuery();

  const pick = (rows?: FakeOrderNotification[]): FakeOrderNotification | undefined => {
    if (!rows || rows.length === 0) return undefined;
    return rows[Math.floor(Math.random() * rows.length)];
  };

  const show = (n?: FakeOrderNotification) => {
    if (!n || !settings) return;
    toast.success(
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-primary/10">
          <ShoppingBag className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="font-medium">Yeni Sipariş!</p>
          <p className="text-sm text-muted-foreground">
            {n.customer}{n.location ? `, ${n.location}` : ""} • {n.time_ago}{" "}
            <span className="font-semibold">{n.product_name}</span> satın aldı
          </p>
        </div>
      </div>,
      { duration: (settings.notification_display_duration ?? 5) * 1000, position: "bottom-left" }
    );
  };

  useEffect(() => {
    if (!settings?.fake_notifications_enabled) return;
    const t = setTimeout(() => { show(firstRandom ?? pick(pool)); }, (settings.notification_delay ?? 10) * 1000);
    return () => clearTimeout(t);
  }, [settings, firstRandom, pool]);

  useEffect(() => {
    if (!settings?.fake_notifications_enabled) return;
    const t = setInterval(() => { show(pick(pool)); }, (settings.notification_interval ?? 30) * 1000);
    return () => clearInterval(t);
  }, [settings, pool]);

  return null;
}
