// src/integrations/metahub/db/types/fakeNotifications.ts
export type FakeOrderNotification = {
  id: string;
  product_name: string;
  customer: string;
  location: string | null;
  time_ago: string;
  is_active: boolean;
  created_at: string;
};

export type FakeNotificationSettings = {
  notification_display_duration: number;
  notification_interval: number;
  notification_delay: number;
  fake_notifications_enabled: boolean;
};
