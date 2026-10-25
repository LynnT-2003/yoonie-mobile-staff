import { useState, useEffect, useCallback } from "react";
import { staffApi } from "../../../lib/domain/staff/staff-api";
import { mutationQueue } from "../../../lib/offline/queue";
import { taskCache, CACHE_KEYS } from "../../../lib/offline/taskCache";
import { useSession } from "../../../lib/session/sessionStore";
import {
  HousekeepingTask,
  CleaningStatus,
  StaffTasksResponseDto,
} from "../../../lib/types";

export function useHousekeeperVm() {
  const { isOnline } = useSession();
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [updatingRoomId, setUpdatingRoomId] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await staffApi.getMyTasks();
      if (res?.housekeeping) {
        setErrorMessage(null);
        setTasks(res.housekeeping);
        void taskCache.set(CACHE_KEYS.STAFF_TASKS, res);
      } else {
        setTasks([]);
      }
    } catch (err) {
      // Fallback to offline cached tasks
      const cached = await taskCache.get<StaffTasksResponseDto>(CACHE_KEYS.STAFF_TASKS);
      if (cached?.housekeeping) {
        setTasks(cached.housekeeping);
      } else {
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to load assigned rooms"
        );
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Load cached tasks first for instant offline rendering
    void taskCache.get<StaffTasksResponseDto>(CACHE_KEYS.STAFF_TASKS).then((cached) => {
      if (isMounted && cached?.housekeeping && cached.housekeeping.length > 0) {
        setTasks(cached.housekeeping);
        setIsLoading(false);
      }
    });

    const loadInitial = async () => {
      try {
        const res = await staffApi.getMyTasks();
        if (isMounted && res?.housekeeping) {
          setErrorMessage(null);
          setTasks(res.housekeeping);
          void taskCache.set(CACHE_KEYS.STAFF_TASKS, res);
        } else if (isMounted) {
          setTasks([]);
        }
      } catch (err) {
        if (isMounted) {
          const cached = await taskCache.get<StaffTasksResponseDto>(CACHE_KEYS.STAFF_TASKS);
          if (cached?.housekeeping) {
            setTasks(cached.housekeeping);
          } else {
            setErrorMessage(
              err instanceof Error ? err.message : "Failed to load assigned rooms"
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
    await fetchTasks();
  }, [fetchTasks]);

  const updateRoomStatus = useCallback(
    async (task: HousekeepingTask, nextStatus: CleaningStatus) => {
      const roomId = task.roomId;
      setUpdatingRoomId(roomId);

      // Optimistic update
      setTasks((prev) =>
        prev.map((t) =>
          t.roomId === roomId ? { ...t, cleaningStatus: nextStatus } : t
        )
      );

      const payload = { toStatus: nextStatus };
      const endpoint = `/staff/rooms/${roomId}/transition`;

      if (!isOnline) {
        await mutationQueue.enqueue(
          `hk_status_${roomId}_${Date.now()}`,
          endpoint,
          "POST",
          payload
        );
        setUpdatingRoomId(null);
        return;
      }

      try {
        await staffApi.transitionRoom(roomId, payload);
      } catch {
        await mutationQueue.enqueue(
          `hk_status_${roomId}_${Date.now()}`,
          endpoint,
          "POST",
          payload
        );
      } finally {
        setUpdatingRoomId(null);
      }
    },
    [isOnline]
  );

  return {
    tasks,
    isLoading,
    isRefreshing,
    errorMessage,
    updatingRoomId,
    onRefresh,
    updateRoomStatus,
    retryFetch: fetchTasks,
  };
}

export type HousekeeperVm = ReturnType<typeof useHousekeeperVm>;
