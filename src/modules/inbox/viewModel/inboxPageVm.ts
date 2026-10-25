import { useState, useEffect, useCallback, useMemo } from "react";
import { notificationsApi } from "../../../lib/domain/notifications/notifications-api";
import { mutationQueue } from "../../../lib/offline/queue";
import { taskCache, CACHE_KEYS } from "../../../lib/offline/taskCache";
import { useSession } from "../../../lib/session/sessionStore";
import { StaffNotification } from "../../../lib/types";

export function useInboxVm() {
  const { isOnline } = useSession();
  const [items, setItems] = useState<StaffNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeAckId, setActiveAckId] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationsApi.getNotifications();
      if (Array.isArray(res)) {
        setErrorMessage(null);
        setItems(res);
        void taskCache.set(CACHE_KEYS.NOTIFICATIONS, res);
      }
    } catch (err) {
      const cached = await taskCache.get<StaffNotification[]>(CACHE_KEYS.NOTIFICATIONS);
      if (cached && cached.length > 0) {
        setItems(cached);
      } else {
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to load notifications"
        );
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Load cached notifications from SQLite first for instant offline launch
    void taskCache.get<StaffNotification[]>(CACHE_KEYS.NOTIFICATIONS).then((cached) => {
      if (isMounted && cached && cached.length > 0) {
        setItems(cached);
        setIsLoading(false);
      }
    });

    const loadInitial = async () => {
      try {
        const res = await notificationsApi.getNotifications();
        if (isMounted && Array.isArray(res)) {
          setErrorMessage(null);
          setItems(res);
          void taskCache.set(CACHE_KEYS.NOTIFICATIONS, res);
        }
      } catch (err) {
        if (isMounted) {
          const cached = await taskCache.get<StaffNotification[]>(CACHE_KEYS.NOTIFICATIONS);
          if (cached && cached.length > 0) {
            setItems(cached);
          } else {
            setErrorMessage(
              err instanceof Error ? err.message : "Failed to load notifications"
            );
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    void loadInitial();

    return () => {
      isMounted = false;
    };
  }, []);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = useMemo(() => {
    return items.filter((n) => !n.readAt || !n.ackedAt).length;
  }, [items]);

  const acknowledge = useCallback(
    async (item: StaffNotification) => {
      setActiveAckId(item.id);
      const ackDate = new Date().toISOString() as any;

      // Optimistic update
      setItems((prev) =>
        prev.map((n) =>
          n.id === item.id ? { ...n, readAt: ackDate, ackedAt: ackDate } : n
        )
      );

      const endpoint = `/notifications/${item.id}/ack`;
      if (!isOnline) {
        await mutationQueue.enqueue(`ack_notification_${item.id}`, endpoint, "PATCH", {});
        setActiveAckId(null);
        return;
      }

      try {
        await notificationsApi.ackNotification(item.id);
      } catch {
        await mutationQueue.enqueue(`ack_notification_${item.id}`, endpoint, "PATCH", {});
      } finally {
        setActiveAckId(null);
      }
    },
    [isOnline]
  );

  return {
    items,
    unreadCount,
    isLoading,
    isRefreshing,
    errorMessage,
    onRefresh,
    activeAckId,
    acknowledge,
    retryFetch: fetchNotifications,
  };
}

export type InboxVm = ReturnType<typeof useInboxVm>;
