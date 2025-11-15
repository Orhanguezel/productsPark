// =============================================================
// FILE: src/hooks/useNotifications.ts
// =============================================================
import { useMemo } from "react";
import { useAuth } from "./useAuth";
import {
  useGetUnreadNotificationCountQuery,
  useListNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
} from "@/integrations/metahub/rtk/endpoints/notifications.endpoints";
import type { Notification } from "@/integrations/metahub/db/types/notifications";

type UseNotificationsOptions = {
  /** Header için sadece sayım lazım ise false bırak (default: false) */
  fetchList?: boolean;
};

export function useNotifications(options?: UseNotificationsOptions) {
  const { user } = useAuth();
  const enabled = !!user;
  const fetchList = options?.fetchList ?? false;

  // 🔢 Unread sayısı (hafif endpoint)
  const {
    data: countData,
    isLoading: isLoadingCount,
    isFetching: isFetchingCount,
    refetch: refetchCount,
  } = useGetUnreadNotificationCountQuery(undefined, {
    skip: !enabled,
  });

  // 📋 Tam liste (isteğe bağlı)
  const {
    data: listData,
    isLoading: isLoadingList,
    isFetching: isFetchingList,
    refetch: refetchList,
  } = useListNotificationsQuery(undefined, {
    skip: !enabled || !fetchList,
  });

  const [markNotificationReadMutation] = useMarkNotificationReadMutation();
  const [markAllReadMutation] = useMarkAllNotificationsReadMutation();
  const [deleteNotificationMutation] = useDeleteNotificationMutation();

  const items = useMemo<Notification[]>(
    () => (listData?.items ?? []) as Notification[],
    [listData],
  );

  const unreadCount =
    typeof countData === "number"
      ? countData
      : listData?.unreadCount ?? 0;

  const isLoading = isLoadingCount || isLoadingList;
  const isFetching = isFetchingCount || isFetchingList;

  const markRead = async (id: string) => {
    if (!enabled) return;
    await markNotificationReadMutation({ id, is_read: true }).unwrap();
    void refetchCount();
    if (fetchList) void refetchList();
  };

  const markAllRead = async () => {
    if (!enabled) return;
    await markAllReadMutation().unwrap();
    void refetchCount();
    if (fetchList) void refetchList();
  };

  const remove = async (id: string) => {
    if (!enabled) return;
    await deleteNotificationMutation(id).unwrap();
    void refetchCount();
    if (fetchList) void refetchList();
  };

  return {
    enabled,
    unreadCount,
    items,
    isLoading,
    isFetching,
    refetchCount,
    refetchList,
    markRead,
    markAllRead,
    remove,
  };
}
