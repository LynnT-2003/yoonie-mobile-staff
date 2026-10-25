import { useState, useEffect, useCallback } from "react";
import { staffApi } from "../../../lib/domain/staff/staff-api";
import { mutationQueue } from "../../../lib/offline/queue";
import { taskCache, CACHE_KEYS } from "../../../lib/offline/taskCache";
import { useSession } from "../../../lib/session/sessionStore";
import { RoomItem, CleaningStatus, UserRole } from "../../../lib/types";

export function useManagerVm() {
  const { currentUser, isOnline, refreshUserProfile } = useSession();
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  // Modal / prompt state for failing inspection
  const [failingRoom, setFailingRoom] = useState<RoomItem | null>(null);
  const [failReason, setFailReason] = useState("");
  const [failError, setFailError] = useState<string | null>(null);

  // Check if current user has housekeeping:inspect permission from /users/me or is Manager/Admin
  const hasInspectPermission = Boolean(
    currentUser?.permissions?.includes("housekeeping:inspect") ||
      currentUser?.role === UserRole.BRANCH_MGR ||
      currentUser?.role === UserRole.ADMIN
  );

  const fetchRooms = useCallback(async () => {
    try {
      const branchId = currentUser?.branchIds?.[0];
      if (!branchId) {
        setErrorMessage("Your account isn't assigned to a hotel yet");
        return;
      }
      const res = await staffApi.getHousekeepingBoard(branchId);
      if (res?.clean) {
        setErrorMessage(null);
        setRooms(res.clean);
        void taskCache.set(CACHE_KEYS.HOUSEKEEPING_BOARD, res.clean);
      }
    } catch (err) {
      // Fall back to offline cached rooms
      const cached = await taskCache.get<RoomItem[]>(CACHE_KEYS.HOUSEKEEPING_BOARD);
      if (cached && cached.length > 0) {
        setRooms(cached);
      } else {
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to load inspection queue"
        );
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentUser]);

  useEffect(() => {
    let isMounted = true;

    // Load cache first for instant launch
    void taskCache.get<RoomItem[]>(CACHE_KEYS.HOUSEKEEPING_BOARD).then((cached) => {
      if (isMounted && cached && cached.length > 0) {
        setRooms(cached);
        setIsLoading(false);
      }
    });

    void refreshUserProfile();

    const loadInitial = async () => {
      try {
        const branchId = currentUser?.branchIds?.[0];
        if (!branchId) {
          if (isMounted) setErrorMessage("Your account isn't assigned to a hotel yet");
          return;
        }
        const res = await staffApi.getHousekeepingBoard(branchId);
        if (isMounted && res?.clean) {
          setErrorMessage(null);
          setRooms(res.clean);
          void taskCache.set(CACHE_KEYS.HOUSEKEEPING_BOARD, res.clean);
        }
      } catch (err) {
        if (isMounted) {
          const cached = await taskCache.get<RoomItem[]>(CACHE_KEYS.HOUSEKEEPING_BOARD);
          if (cached && cached.length > 0) {
            setRooms(cached);
          } else {
            setErrorMessage(
              err instanceof Error ? err.message : "Failed to load inspection queue"
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

    // Replay 409 conflict listener: automatically reload board if conflict occurred
    const unsubConflict = mutationQueue.onConflictRefetch(() => {
      void fetchRooms();
    });

    return () => {
      isMounted = false;
      unsubConflict();
    };
  }, [currentUser, fetchRooms, refreshUserProfile]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchRooms();
  }, [fetchRooms]);

  const passInspection = useCallback(
    async (room: RoomItem) => {
      if (!hasInspectPermission) {
        setErrorMessage("Action denied: Missing housekeeping:inspect permission.");
        return;
      }

      setActiveRoomId(room._id);
      // Remove from clean inspection queue optimistically
      setRooms((prev) => prev.filter((r) => r._id !== room._id));

      const endpoint = `/staff/rooms/${room._id}/transition`;
      const payload = { toStatus: CleaningStatus.INSPECTED };

      if (!isOnline) {
        await mutationQueue.enqueue(
          `pass_inspection_room_${room.roomNumber}`,
          endpoint,
          "POST",
          payload
        );
        setActiveRoomId(null);
        return;
      }

      try {
        await staffApi.transitionRoom(room._id, payload);
      } catch {
        await mutationQueue.enqueue(
          `pass_inspection_room_${room.roomNumber}`,
          endpoint,
          "POST",
          payload
        );
      } finally {
        setActiveRoomId(null);
      }
    },
    [hasInspectPermission, isOnline]
  );

  const openFailModal = useCallback(
    (room: RoomItem) => {
      if (!hasInspectPermission) {
        setErrorMessage("Action denied: Missing housekeeping:inspect permission.");
        return;
      }
      setFailingRoom(room);
      setFailReason("");
      setFailError(null);
    },
    [hasInspectPermission]
  );

  const closeFailModal = useCallback(() => {
    setFailingRoom(null);
    setFailReason("");
    setFailError(null);
  }, []);

  const submitFailInspection = useCallback(async () => {
    if (!failingRoom) return;
    if (!hasInspectPermission) {
      setFailError("Action denied: Missing housekeeping:inspect permission.");
      return;
    }
    if (!failReason.trim()) {
      setFailError("Inspection failure reason is required (e.g. linen replacement needed)");
      return;
    }

    const roomId = failingRoom._id;
    const roomNumber = failingRoom.roomNumber;
    setActiveRoomId(roomId);
    closeFailModal();

    // Remove from clean inspection queue optimistically
    setRooms((prev) => prev.filter((r) => r._id !== roomId));

    const endpoint = `/staff/rooms/${roomId}/transition`;
    const payload = {
      toStatus: CleaningStatus.DIRTY,
      reason: failReason.trim(),
    };

    if (!isOnline) {
      await mutationQueue.enqueue(
        `fail_inspection_room_${roomNumber}`,
        endpoint,
        "POST",
        payload
      );
      setActiveRoomId(null);
      return;
    }

    try {
      await staffApi.transitionRoom(roomId, payload);
    } catch {
      await mutationQueue.enqueue(
        `fail_inspection_room_${roomNumber}`,
        endpoint,
        "POST",
        payload
      );
    } finally {
      setActiveRoomId(null);
    }
  }, [failingRoom, failReason, closeFailModal, hasInspectPermission, isOnline]);

  return {
    rooms,
    isLoading,
    isRefreshing,
    errorMessage,
    hasInspectPermission,
    onRefresh,
    activeRoomId,
    failingRoom,
    failReason,
    setFailReason,
    failError,
    openFailModal,
    closeFailModal,
    submitFailInspection,
    passInspection,
    retryFetch: fetchRooms,
  };
}

export type ManagerVm = ReturnType<typeof useManagerVm>;
