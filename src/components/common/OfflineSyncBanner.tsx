import React from "react";
import { StyleSheet } from "react-native";
import { useSession } from "../../lib/session/sessionStore";
import { gutter } from "../../constants/theme";
import { Banner } from "../ui";

export const OfflineSyncBanner: React.FC = () => {
  const { isOnline, pendingOfflineCount, syncOfflineQueue } = useSession();

  if (isOnline && pendingOfflineCount === 0) {
    return null;
  }

  const changes = `${pendingOfflineCount} ${pendingOfflineCount === 1 ? "change" : "changes"}`;

  return !isOnline ? (
    <Banner
      tone="warning"
      icon="wifiOff"
      title="You're offline"
      message={
        pendingOfflineCount > 0
          ? `${changes} saved on this device. They'll sync when you reconnect.`
          : "Updates will be saved on this device and synced when you reconnect."
      }
      style={styles.banner}
    />
  ) : (
    <Banner
      tone="brand"
      icon="sync"
      title="Ready to sync"
      message={`${changes} saved on this device.`}
      actionLabel="Sync now"
      onAction={() => void syncOfflineQueue()}
      style={styles.banner}
    />
  );
};

const styles = StyleSheet.create({
  banner: { marginHorizontal: gutter, marginBottom: 12 },
});
