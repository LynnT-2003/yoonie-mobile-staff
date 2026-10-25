import { useState, useEffect, useCallback } from "react";
import { Linking, Alert } from "react-native";
import { staffApi } from "../../../lib/domain/staff/staff-api";
import { mutationQueue } from "../../../lib/offline/queue";
import { taskCache, CACHE_KEYS } from "../../../lib/offline/taskCache";
import { useSession } from "../../../lib/session/sessionStore";
import {
  PickupTaskDto,
  DispatchStatus,
  StaffTasksResponseDto,
  PickupStage,
  PickupIssueKind,
} from "../../../lib/types";

export const PICKUP_STAGE_ORDER: PickupStage[] = [
  "ASSIGNED",
  "CONFIRMED",
  "EN_ROUTE",
  "AT_AIRPORT",
  "GUEST_ON_BOARD",
  "DROPPED_OFF",
];

/** Older API responses without a stage are read from the task status. */
export const pickupStage = (t: PickupTaskDto): PickupStage =>
  t.stage ??
  (t.dispatchStatus === DispatchStatus.DONE
    ? "DROPPED_OFF"
    : t.dispatchStatus === DispatchStatus.IN_PROGRESS
      ? "EN_ROUTE"
      : "ASSIGNED");

export const nextPickupStage = (t: PickupTaskDto): PickupStage | undefined =>
  PICKUP_STAGE_ORDER[PICKUP_STAGE_ORDER.indexOf(pickupStage(t)) + 1];

export function useDriverVm() {
  const { isOnline } = useSession();
  const [tasks, setTasks] = useState<PickupTaskDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeDispatchId, setActiveDispatchId] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await staffApi.getMyTasks();
      if (res?.pickups) {
        setErrorMessage(null);
        setTasks(res.pickups);
        void taskCache.set(CACHE_KEYS.STAFF_TASKS, res);
      } else {
        setTasks([]);
      }
    } catch (err) {
      const cached = await taskCache.get<StaffTasksResponseDto>(CACHE_KEYS.STAFF_TASKS);
      if (cached?.pickups) {
        setTasks(cached.pickups);
      } else {
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to load assigned pickups"
        );
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Load cached pickups first for instant offline rendering
    void taskCache.get<StaffTasksResponseDto>(CACHE_KEYS.STAFF_TASKS).then((cached) => {
      if (isMounted && cached?.pickups && cached.pickups.length > 0) {
        setTasks(cached.pickups);
        setIsLoading(false);
      }
    });

    const loadInitial = async () => {
      try {
        const res = await staffApi.getMyTasks();
        if (isMounted && res?.pickups) {
          setErrorMessage(null);
          setTasks(res.pickups);
          void taskCache.set(CACHE_KEYS.STAFF_TASKS, res);
        } else if (isMounted) {
          setTasks([]);
        }
      } catch (err) {
        if (isMounted) {
          const cached = await taskCache.get<StaffTasksResponseDto>(CACHE_KEYS.STAFF_TASKS);
          if (cached?.pickups) {
            setTasks(cached.pickups);
          } else {
            setErrorMessage(
              err instanceof Error ? err.message : "Failed to load assigned pickups"
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

  const callGuest = useCallback((phone?: string, guestName?: string) => {
    if (!phone) {
      Alert.alert(
        "No Phone Number",
        `No direct telephone contact recorded for ${guestName || "this passenger"}.`
      );
      return;
    }
    const clean = phone.replace(/[^0-9+]/g, "");
    Linking.openURL(`tel:${clean}`).catch(() => {
      Alert.alert("Unable to Call", `Could not initiate phone call to ${clean}.`);
    });
  }, []);

  /** Send or, when offline, queue a pickup call; the optimistic state stays either way. */
  const sendOrQueue = useCallback(
    async (action: string, endpoint: string, body: object, send: () => Promise<unknown>) => {
      const queue = () => mutationQueue.enqueue(`${action}_${Date.now()}`, endpoint, "POST", body);
      if (!isOnline) return queue();
      try {
        await send();
      } catch {
        await queue();
      }
    },
    [isOnline]
  );

  /** Report the next step of the journey; the desk sees it live. */
  const advance = useCallback(
    async (task: PickupTaskDto) => {
      const next = nextPickupStage(task);
      if (!next) return;
      const id = task.dispatchId;
      setActiveDispatchId(id);
      const now = new Date().toISOString();
      setTasks((prev) =>
        prev.map((t) =>
          t.dispatchId === id
            ? {
                ...t,
                stage: next,
                issue: undefined,
                steps: [...(t.steps ?? []), { stage: next, at: now }],
                dispatchStatus:
                  next === "DROPPED_OFF"
                    ? DispatchStatus.DONE
                    : next === "CONFIRMED"
                      ? t.dispatchStatus
                      : DispatchStatus.IN_PROGRESS,
              }
            : t
        )
      );
      await sendOrQueue("pickup_step", `/staff/pickups/${id}/step`, { stage: next }, () =>
        staffApi.recordPickupStep(id, next)
      );
      setActiveDispatchId(null);
    },
    [sendOrQueue]
  );

  /** Something is wrong: alert the desk, who answer with "keep waiting" or "no-show". */
  const reportIssue = useCallback(
    async (task: PickupTaskDto, kind: PickupIssueKind, note?: string) => {
      const id = task.dispatchId;
      setActiveDispatchId(id);
      setTasks((prev) =>
        prev.map((t) =>
          t.dispatchId === id ? { ...t, issue: { kind, note, at: new Date().toISOString() } } : t
        )
      );
      await sendOrQueue("pickup_issue", `/staff/pickups/${id}/issue`, { kind, note }, () =>
        staffApi.reportPickupIssue(id, kind, note)
      );
      setActiveDispatchId(null);
    },
    [sendOrQueue]
  );

  return {
    tasks,
    isLoading,
    isRefreshing,
    errorMessage,
    activeDispatchId,
    onRefresh,
    callGuest,
    advance,
    reportIssue,
    retryFetch: fetchTasks,
  };
}

export type DriverVm = ReturnType<typeof useDriverVm>;
