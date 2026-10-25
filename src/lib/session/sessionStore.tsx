import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import * as Network from "expo-network";
import { tokenStore } from "../domain/api/tokenStore";
import { authApi } from "../domain/auth/auth-api";
import { usersApi } from "../domain/users/users-api";
import { setSessionExpiredHandler, ApiError } from "../domain/api/NetworkManager";
import { pushService } from "../push/pushService";
import { mutationQueue } from "../offline/queue";
import { taskCache } from "../offline/taskCache";
import { ICurrentUser, UserRole } from "../types";

export interface SessionContextType {
  currentUser: ICurrentUser | null;
  isLoading: boolean;
  isOnline: boolean;
  isSessionExpired: boolean;
  isAccountSuspended: boolean;
  queueUserMessage: string | null;
  pendingOfflineCount: number;
  login: (email: string, password?: string) => Promise<ICurrentUser>;
  logout: () => Promise<void>;
  syncOfflineQueue: () => Promise<void>;
  refreshUserProfile: () => Promise<ICurrentUser | null>;
  dismissSessionExpired: () => void;
  dismissAccountSuspended: () => void;
  clearQueueMessage: () => void;
  getRoleRedirectPath: (user: ICurrentUser | null) => string;
}

const SessionContext = createContext<SessionContextType | null>(null);

export function getRoleRedirectPath(user: ICurrentUser | null): string {
  if (!user) return "/(auth)/login";

  // Forced password change takes precedence
  if (user.mustChangePassword) {
    return "/(auth)/change-password";
  }

  const role = user.role;
  const job = (typeof user.jobTitle === "string" ? user.jobTitle : "")
    .toUpperCase()
    .trim();

  // Redirect strictly by role + jobTitle
  if (role === UserRole.STAFF) {
    if (job === "HOUSEKEEPER" || job.includes("HOUSEKEEP")) {
      return "/(app)/housekeeper";
    }
    if (job === "DRIVER" || job.includes("DRIVER")) {
      return "/(app)/driver";
    }
    // Staff without valid mobile operational role
    return "/(auth)/wrong-role";
  }

  if (role === UserRole.DISPATCHER) {
    return "/(app)/dispatcher";
  }

  if (role === UserRole.BRANCH_MGR || role === UserRole.ADMIN) {
    return "/(app)/manager";
  }

  // Guests or unrecognized role
  return "/(auth)/wrong-role";
}

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<ICurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [isAccountSuspended, setIsAccountSuspended] = useState(false);
  const [queueUserMessage, setQueueUserMessage] = useState<string | null>(null);
  const [pendingOfflineCount, setPendingOfflineCount] = useState(0);

  const refreshPendingCount = useCallback(async () => {
    const count = await mutationQueue.getPendingCount();
    setPendingOfflineCount(count);
  }, []);

  const syncOfflineQueue = useCallback(async () => {
    if (!isOnline) return;
    await mutationQueue.replayAll();
    await refreshPendingCount();
  }, [isOnline, refreshPendingCount]);

  const checkNetwork = useCallback(async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      setIsOnline(online);
      if (online) {
        void syncOfflineQueue();
      }
    } catch {
      setIsOnline(true);
    }
  }, [syncOfflineQueue]);

  const refreshUserProfile = useCallback(async (): Promise<ICurrentUser | null> => {
    if (!tokenStore.getAccessToken()) return null;
    try {
      const fresh = await usersApi.getMe();
      const mapped: ICurrentUser = {
        ...fresh,
        userId: fresh._id,
        email: typeof fresh.email === "string" ? fresh.email : null,
        jobTitle: typeof fresh.jobTitle === "string" ? fresh.jobTitle : null,
      };
      await tokenStore.updateUser(mapped);
      setCurrentUser(mapped);
      return mapped;
    } catch (err) {
      if (err instanceof ApiError && err.isAccountSuspended) {
        setIsAccountSuspended(true);
      }
      return null;
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await tokenStore.init();
      const user = tokenStore.getCurrentUser();
      setCurrentUser(user);
      await checkNetwork();
      await refreshPendingCount();
      setIsLoading(false);

      if (user && tokenStore.getAccessToken()) {
        void refreshUserProfile();
      }
    };

    void init();

    setSessionExpiredHandler(() => {
      setIsSessionExpired(true);
      setCurrentUser(null);
    });

    const unsubQueue = mutationQueue.subscribe(() => {
      void refreshPendingCount();
    });

    const unsubMsg = mutationQueue.onUserMessage((msg) => {
      setQueueUserMessage(msg);
    });

    const interval = setInterval(() => {
      void checkNetwork();
    }, 15_000);

    return () => {
      unsubQueue();
      unsubMsg();
      clearInterval(interval);
    };
  }, [checkNetwork, refreshPendingCount, refreshUserProfile]);

  const login = useCallback(
    async (email: string, password?: string): Promise<ICurrentUser> => {
      setIsLoading(true);
      setIsSessionExpired(false);
      setIsAccountSuspended(false);
      try {
        const res = await authApi.login({
          email,
          password: password || "Password123!",
        });
        const mappedUser: ICurrentUser = {
          ...res.user,
          userId: res.user._id,
          email: typeof res.user.email === "string" ? res.user.email : email,
          jobTitle:
            typeof res.user.jobTitle === "string" ? res.user.jobTitle : null,
        };
        await tokenStore.updateTokens(
          res.tokens.accessToken,
          res.tokens.refreshToken,
          mappedUser
        );
        setCurrentUser(mappedUser);
        // Register push token
        void pushService.register();
        return mappedUser;
      } catch (err) {
        if (err instanceof ApiError && err.isAccountSuspended) {
          setIsAccountSuspended(true);
        }
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    setIsSessionExpired(false);
    setIsAccountSuspended(false);
    const refresh = tokenStore.getRefreshToken();
    const userId = currentUser?.userId || currentUser?._id || tokenStore.getUserId();
    void pushService.unregister();
    if (userId && refresh) {
      try {
        await authApi.logout(userId, refresh);
      } catch {
        // Continue clearing even if server logout request fails
      }
    }
    await tokenStore.clear();
    await taskCache.clearAll();
    setCurrentUser(null);
  }, [currentUser]);

  const dismissSessionExpired = useCallback(() => {
    setIsSessionExpired(false);
  }, []);

  const dismissAccountSuspended = useCallback(() => {
    setIsAccountSuspended(false);
  }, []);

  const clearQueueMessage = useCallback(() => {
    setQueueUserMessage(null);
  }, []);

  return (
    <SessionContext.Provider
      value={{
        currentUser,
        isLoading,
        isOnline,
        isSessionExpired,
        isAccountSuspended,
        queueUserMessage,
        pendingOfflineCount,
        login,
        logout,
        syncOfflineQueue,
        refreshUserProfile,
        dismissSessionExpired,
        dismissAccountSuspended,
        clearQueueMessage,
        getRoleRedirectPath,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export function useSession(): SessionContextType {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
