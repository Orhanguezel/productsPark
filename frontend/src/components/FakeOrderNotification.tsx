// src/components/FakeOrderNotification.tsx
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { ShoppingBag } from "lucide-react";
import {
  useGetPublicFakeNotificationSettingsQuery, 
  useListPublicFakeOrdersQuery,
  useGetPublicRandomFakeOrderQuery,
} from '@/integrations/hooks';

import type { FakeOrderNotification } from "@/integrations/types";

export function FakeOrderNotification() {
  const { data: settings } = useGetPublicFakeNotificationSettingsQuery();
  const { data: pool } = useListPublicFakeOrdersQuery();
  const { data: firstRandom } = useGetPublicRandomFakeOrderQuery();

  const firstShownRef = useRef(false);

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

  // İlk bildirimi yalnızca bir kez göster (settings ve veriler hazır olduğunda)
  useEffect(() => {
    if (!settings?.fake_notifications_enabled) return;
    if (firstShownRef.current) return;
    const t = setTimeout(() => {
      firstShownRef.current = true;
      show(firstRandom ?? pick(pool));
    }, (settings.notification_delay ?? 10) * 1000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, pool, firstRandom]);

  useEffect(() => {
    if (!settings?.fake_notifications_enabled) return;
    const t = setInterval(() => { show(pick(pool)); }, (settings.notification_interval ?? 30) * 1000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, pool]);

  return null;
}
