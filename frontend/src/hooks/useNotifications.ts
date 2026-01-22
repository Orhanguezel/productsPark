// =============================================================
// FILE: src/hooks/useNotifications.ts
// FINAL — Notifications hook (RTK + central types)
// - Types from "@/integrations/types"
// - RTK hooks from "@/integrations/hooks"
// - strict/no-any
// =============================================================

import { useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

import {
  useListNotificationsQuery,
  useGetUnreadCountQuery,
  useCreateNotificationMutation,
  useUpdateNotificationMutation,
  useMarkAllReadMutation,
  useDeleteNotificationMutation,
} from '@/integrations/hooks';

import type {
  NotificationView,
  NotificationsListParams,
  CreateNotificationBody,
} from '@/integrations/types';

type UseNotificationsOptions = {
  /** Header için sadece sayım lazım ise false bırak (default: false) */
  fetchList?: boolean;

  /** Liste query paramları (limit/offset/type/is_read vs.) */
  listParams?: NotificationsListParams;
};

export function useNotifications(options?: UseNotificationsOptions) {
  const { user } = useAuth();

  const enabled = !!user?.id;
  const fetchList = options?.fetchList ?? false;
  const listParams = options?.listParams;

  // 🔢 Unread sayısı (hafif endpoint) -> {count:number}
  const {
    data: countData,
    isLoading: isLoadingCount,
    isFetching: isFetchingCount,
    refetch: refetchCount,
  } = useGetUnreadCountQuery(undefined, {
    skip: !enabled,
  });

  // 📋 Tam liste (isteğe bağlı) -> NotificationView[]
  const {
    data: listData,
    isLoading: isLoadingList,
    isFetching: isFetchingList,
    refetch: refetchList,
  } = useListNotificationsQuery(listParams ?? undefined, {
    skip: !enabled || !fetchList,
  });

  const [createNotificationMutation] = useCreateNotificationMutation();
  const [updateNotificationMutation] = useUpdateNotificationMutation();
  const [markAllReadMutation] = useMarkAllReadMutation();
  const [deleteNotificationMutation] = useDeleteNotificationMutation();

  const items = useMemo<NotificationView[]>(
    () => (Array.isArray(listData) ? listData : []),
    [listData],
  );

  const unreadCount = typeof countData?.count === 'number' ? countData.count : 0;

  const isLoading = isLoadingCount || isLoadingList;
  const isFetching = isFetchingCount || isFetchingList;

  const markRead = useCallback(
    async (id: string) => {
      if (!enabled) return;

      await updateNotificationMutation({
        id,
        body: { is_read: true },
      }).unwrap();

      void refetchCount();
      if (fetchList) void refetchList();
    },
    [enabled, updateNotificationMutation, refetchCount, fetchList, refetchList],
  );

  const markAllRead = useCallback(async () => {
    if (!enabled) return;

    await markAllReadMutation().unwrap();

    void refetchCount();
    if (fetchList) void refetchList();
  }, [enabled, markAllReadMutation, refetchCount, fetchList, refetchList]);

  const remove = useCallback(
    async (id: string) => {
      if (!enabled) return;

      await deleteNotificationMutation({ id }).unwrap();

      void refetchCount();
      if (fetchList) void refetchList();
    },
    [enabled, deleteNotificationMutation, refetchCount, fetchList, refetchList],
  );

  const create = useCallback(
    async (body: CreateNotificationBody) => {
      if (!enabled) return null;

      const created = await createNotificationMutation(body).unwrap();

      void refetchCount();
      if (fetchList) void refetchList();

      return created;
    },
    [enabled, createNotificationMutation, refetchCount, fetchList, refetchList],
  );

  return {
    enabled,

    unreadCount,
    items,

    isLoading,
    isFetching,

    refetchCount,
    refetchList,

    create,
    markRead,
    markAllRead,
    remove,
  };
}
