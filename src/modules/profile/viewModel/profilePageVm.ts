import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { Alert } from "react-native";
import { useSession } from "../../../lib/session/sessionStore";
import { staffApi } from "../../../lib/domain/staff/staff-api";
import { pushService } from "../../../lib/push/pushService";

export function useProfileVm() {
  const router = useRouter();
  const { currentUser, logout, isOnline } = useSession();
  const [notificationsEnabled, setNotificationsEnabled] = useState(() =>
    Boolean(pushService.getPushToken())
  );
  const [isLinkingLine, setIsLinkingLine] = useState(false);
  const [lineTokenInfo, setLineTokenInfo] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const toggleNotifications = useCallback(async (value: boolean) => {
    setNotificationsEnabled(value);
    if (value) {
      const token = await pushService.register();
      if (token) {
        Alert.alert(
          "Push Enabled",
          "Mobile push notifications registered for your shift."
        );
      } else {
        setNotificationsEnabled(false);
        if (pushService.isUnavailable()) {
          Alert.alert("Push Unavailable", pushService.getStatus());
        }
      }
    } else {
      await pushService.unregister();
      Alert.alert(
        "Push Disabled",
        "Push notifications unregistered for this device."
      );
    }
  }, []);

  const connectLine = useCallback(async () => {
    setIsLinkingLine(true);
    try {
      const res = await staffApi.createLineLinkToken();
      if (res?.code) {
        setLineTokenInfo(
          `Link Code: ${res.code} (Expires: ${new Date(res.expiresAt).toLocaleTimeString()})\n${res.instructions}`
        );
      } else {
        setLineTokenInfo("LINE linking token generated. Open official LINE account to connect.");
      }
    } catch (err) {
      setLineTokenInfo(
        err instanceof Error ? err.message : "Failed to generate LINE link token. Please verify server connection."
      );
    } finally {
      setIsLinkingLine(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.replace("/(auth)/login" as any);
    } finally {
      setIsLoggingOut(false);
    }
  }, [logout, router]);

  return {
    currentUser,
    isOnline,
    notificationsEnabled,
    pushUnavailable: pushService.isUnavailable(),
    pushStatusMessage: pushService.getStatus(),
    toggleNotifications,
    connectLine,
    isLinkingLine,
    lineTokenInfo,
    handleLogout,
    isLoggingOut,
  };
}

export type ProfileVm = ReturnType<typeof useProfileVm>;
