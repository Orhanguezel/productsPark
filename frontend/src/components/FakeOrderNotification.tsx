import { useEffect, useState } from "react";
import { metahub } from "@/integrations/metahub/client";
import { toast } from "sonner";
import { ShoppingBag } from "lucide-react";

interface Notification {
  id: string;
  product_id: string;
  products: {
    name: string;
  };
}

interface Settings {
  notification_display_duration: number;
  notification_interval: number;
  notification_delay: number;
  fake_notifications_enabled: boolean;
}

export function FakeOrderNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<Settings>({
    notification_display_duration: 5,
    notification_interval: 30,
    notification_delay: 10,
    fake_notifications_enabled: true,
  });

  useEffect(() => {
    fetchSettings();
    fetchNotifications();

    // Subscribe to settings changes
    const channel = metahub
      .channel('settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings',
          filter: 'key=eq.fake_notifications_enabled'
        },
        () => {
          console.log('Notification settings updated, refetching...');
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      metahub.removeChannel(channel);
    };
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await metahub
        .from("site_settings")
        .select("*")
        .in("key", [
          "notification_display_duration",
          "notification_interval",
          "notification_delay",
          "fake_notifications_enabled",
        ]);

      if (error) throw error;

      const settingsObj = data.reduce((acc, item) => {
        if (item.key === "fake_notifications_enabled") {
          acc[item.key] = item.value === true || item.value === "true";
        } else {
          const numValue = typeof item.value === 'number' ? item.value : parseFloat(String(item.value));
          acc[item.key] = isNaN(numValue) ? 0 : numValue;
        }
        return acc;
      }, {} as any);

      setSettings({
        notification_display_duration:
          settingsObj.notification_display_duration || 5,
        notification_interval: settingsObj.notification_interval || 30,
        notification_delay: settingsObj.notification_delay || 10,
        fake_notifications_enabled: settingsObj.fake_notifications_enabled !== undefined ? settingsObj.fake_notifications_enabled : true,
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data, error } = await metahub
        .from("products")
        .select("id, name")
        .eq("is_active", true);

      if (error) throw error;
      if (data && data.length > 0) {
        setNotifications(data.map(product => ({
          id: product.id,
          product_id: product.id,
          products: { name: product.name }
        })));
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    if (notifications.length === 0 || !settings.fake_notifications_enabled) return;

    // Initial delay before showing first notification
    const initialTimer = setTimeout(() => {
      showRandomNotification();
    }, settings.notification_delay * 1000);

    return () => clearTimeout(initialTimer);
  }, [notifications, settings.notification_delay, settings.fake_notifications_enabled]);

  useEffect(() => {
    if (notifications.length === 0 || !settings.fake_notifications_enabled) return;

    // Set up interval for subsequent notifications
    const intervalTimer = setInterval(() => {
      showRandomNotification();
    }, settings.notification_interval * 1000);

    return () => clearInterval(intervalTimer);
  }, [notifications, settings.notification_interval, settings.fake_notifications_enabled]);

  const showRandomNotification = () => {
    if (notifications.length === 0) return;

    // Pick a random notification
    const randomIndex = Math.floor(Math.random() * notifications.length);
    const notification = notifications[randomIndex];
    const randomMinutes = Math.floor(Math.random() * 10) + 1; // 1-10 dakika önce

    toast.success(
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-primary/10">
          <ShoppingBag className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="font-medium">Yeni Sipariş!</p>
          <p className="text-sm text-muted-foreground">
            Birisi {randomMinutes} dakika önce{" "}
            <span className="font-semibold">{notification.products?.name}</span> satın aldı
          </p>
        </div>
      </div>,
      {
        duration: settings.notification_display_duration * 1000,
        position: "bottom-left",
      }
    );
  };

  return null;
}
