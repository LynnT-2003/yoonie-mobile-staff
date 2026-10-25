import { useState, useEffect, useCallback, useMemo } from "react";
import { staffApi } from "../../../lib/domain/staff/staff-api";
import { mutationQueue } from "../../../lib/offline/queue";
import { taskCache, CACHE_KEYS } from "../../../lib/offline/taskCache";
import { useSession } from "../../../lib/session/sessionStore";
import {
  DispatchTaskItem,
  DispatchType,
  DispatchStatus,
  TourDecision,
} from "../../../lib/types";

export function useDispatcherVm() {
  const { isOnline, currentUser } = useSession();
  const [tasks, setTasks] = useState<DispatchTaskItem[]>([]);
  const [filterType, setFilterType] = useState<DispatchType | "ALL">("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const fetchDispatches = useCallback(async () => {
    try {
      const branchId = currentUser?.branchIds?.[0];
      if (!branchId) {
        setErrorMessage("Your account isn't assigned to a hotel yet");
        return;
      }
      const res = await staffApi.getDispatches(branchId);
      if (Array.isArray(res)) {
        setErrorMessage(null);
        setTasks(res);
        void taskCache.set(CACHE_KEYS.DISPATCH_TASKS, res);
      } else {
        setTasks([]);
      }
    } catch (err) {
      const cached = await taskCache.get<DispatchTaskItem[]>(CACHE_KEYS.DISPATCH_TASKS);
      if (cached && cached.length > 0) {
        setTasks(cached);
      } else {
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to load dispatch board"
        );
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentUser]);

  useEffect(() => {
    let isMounted = true;

    // Load cached dispatches first
    void taskCache.get<DispatchTaskItem[]>(CACHE_KEYS.DISPATCH_TASKS).then((cached) => {
      if (isMounted && cached && cached.length > 0) {
        setTasks(cached);
        setIsLoading(false);
      }
    });

    const loadInitial = async () => {
      try {
        const branchId = currentUser?.branchIds?.[0];
        if (!branchId) {
          if (isMounted) setErrorMessage("Your account isn't assigned to a hotel yet");
          return;
        }
        const res = await staffApi.getDispatches(branchId);
        if (isMounted && Array.isArray(res)) {
          setErrorMessage(null);
          setTasks(res);
          void taskCache.set(CACHE_KEYS.DISPATCH_TASKS, res);
        } else if (isMounted) {
          setTasks([]);
        }
      } catch (err) {
        if (isMounted) {
          const cached = await taskCache.get<DispatchTaskItem[]>(CACHE_KEYS.DISPATCH_TASKS);
          if (cached && cached.length > 0) {
            setTasks(cached);
          } else {
            setErrorMessage(
              err instanceof Error ? err.message : "Failed to load dispatch board"
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
  }, [currentUser]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchDispatches();
  }, [fetchDispatches]);

  // Derived filtered tasks
  const filteredTasks = useMemo(() => {
    if (filterType === "ALL") return tasks;
    return tasks.filter((t) => t.type === filterType);
  }, [tasks, filterType]);

  // Derived high level counters
  const stats = useMemo(() => {
    const total = tasks.length;
    // ACKNOWLEDGED is retired; any old rows still count as open
    const open = tasks.filter(
      (t) => t.status === DispatchStatus.OPEN || t.status === DispatchStatus.ACKNOWLEDGED
    ).length;
    const inProgress = tasks.filter(
      (t) => t.status === DispatchStatus.IN_PROGRESS
    ).length;
    const done = tasks.filter((t) => t.status === DispatchStatus.DONE).length;
    return { total, open, inProgress, done };
  }, [tasks]);

  /** Queue a write for later when offline or when the request fails. */
  const sendOrQueue = useCallback(
    async (key: string, endpoint: string, body: Record<string, unknown>, send: () => Promise<unknown>) => {
      if (!isOnline) {
        await mutationQueue.enqueue(`${key}_${Date.now()}`, endpoint, "POST", body);
        return;
      }
      try {
        await send();
      } catch {
        await mutationQueue.enqueue(`${key}_${Date.now()}`, endpoint, "POST", body);
      }
    },
    [isOnline]
  );

  /**
   * Drivers report their own pickup steps from their phones. The dispatcher only answers
   * when a driver reports a problem: keep waiting, or close it as a no-show.
   */
  const answerIssue = useCallback(
    async (task: DispatchTaskItem, resolution: "KEEP_WAITING" | "NO_SHOW") => {
      if (!task.pickup?.issue) return;
      setActiveTaskId(task._id);
      setTasks((prev) =>
        prev.map((t) =>
          t._id === task._id && t.pickup
            ? {
                ...t,
                status: resolution === "NO_SHOW" ? DispatchStatus.DISMISSED : t.status,
                pickup: { ...t.pickup, issue: undefined },
              }
            : t
        )
      );
      await sendOrQueue(`pickup_issue_${task._id}`, `/dispatch/${task._id}/pickup-issue`, { resolution }, () =>
        staffApi.answerPickupIssue(task._id, resolution)
      );
      setActiveTaskId(null);
    },
    [sendOrQueue]
  );

  /** Close a tour flag: keep it running, merge it, or cancel the departure. */
  const decideTour = useCallback(
    async (task: DispatchTaskItem, decision: TourDecision) => {
      setActiveTaskId(task._id);
      setTasks((prev) => prev.map((t) => (t._id === task._id ? { ...t, status: DispatchStatus.DONE } : t)));
      await sendOrQueue(`tour_${task._id}`, `/dispatch/${task._id}/decision`, { decision }, () =>
        staffApi.decideTour(task._id, decision)
      );
      setActiveTaskId(null);
    },
    [sendOrQueue]
  );

  return {
    tasks: filteredTasks,
    stats,
    filterType,
    setFilterType,
    isLoading,
    isRefreshing,
    errorMessage,
    activeTaskId,
    onRefresh,
    answerIssue,
    decideTour,
    /** cancelling a departure loses revenue and means refunds: managers only */
    canCancelTour: currentUser?.role !== "DISPATCHER",
    retryFetch: fetchDispatches,
  };
}

export type DispatcherVm = ReturnType<typeof useDispatcherVm>;
