// ===================================================================
// FILE: src/integrations/metahub/db/types/notifications.ts
// ===================================================================

/** Backend notifications tablosuna karşılık gelen tip (FE tarafı) */
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string; // ISO datetime string
}

/** GET /notifications dönüş tipi (liste + unread sayısı) */
export interface NotificationsListResult {
  items: Notification[];
  unreadCount: number;
}

/** POST /notifications body tipi (auth user için user_id BE'de set ediliyor) */
export interface CreateNotificationBody {
  title: string;
  message: string;
  type?: string; // default "custom" vs backend'de handle edebilirsin
}

/** PATCH /notifications/:id body (opsiyonel is_read paramı) */
export interface UpdateNotificationBody {
  id: string;
  is_read?: boolean;
}

/** POST /notifications/mark-all-read dönüş tipi */
export interface MarkAllReadResult {
  updated: number;
}
