import React, { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, Text, Modal, StyleSheet, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SessionProvider, useSession } from "../lib/session/sessionStore";
import { pushService } from "../lib/push/pushService";
import { brandMascot } from "../constants/brandAssets";
import { gutter, radii, type, ui } from "../constants/theme";
import { Banner, Button } from "../components/ui";

function RootContent() {
  const router = useRouter();
  const {
    isSessionExpired,
    isAccountSuspended,
    queueUserMessage,
    clearQueueMessage,
    dismissSessionExpired,
    dismissAccountSuspended,
    logout,
  } = useSession();

  useEffect(() => {
    // Listen for push taps and deep-link
    const unsub = pushService.setupListeners({
      onResponse: (url) => {
        try {
          router.push(url as any);
        } catch (e) {
          console.warn("[RootLayout] Push navigation failed:", e);
        }
      },
    });

    return () => unsub();
  }, [router]);

  const handleDismissExpired = async () => {
    dismissSessionExpired();
    await logout();
    router.replace("/(auth)/login" as any);
  };

  const handleDismissSuspended = async () => {
    dismissAccountSuspended();
    await logout();
    router.replace("/(auth)/login" as any);
  };

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>

      {/* Offline queue message */}
      {queueUserMessage ? (
        <SafeAreaView edges={["top"]} style={styles.bannerContainer} pointerEvents="box-none">
          <Banner
            message={queueUserMessage}
            actionLabel="Dismiss"
            onAction={clearQueueMessage}
            style={styles.banner}
          />
        </SafeAreaView>
      ) : null}

      <Modal visible={isSessionExpired} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.dialogCard}>
            <Image source={brandMascot.worried} style={styles.mascotIcon} resizeMode="contain" />
            <Text style={styles.dialogTitle}>Session expired</Text>
            <Text style={styles.dialogMessage}>
              You were signed out, possibly from another device. Sign in again to continue your shift.
            </Text>
            <Button label="Sign in again" onPress={handleDismissExpired} style={styles.dialogButton} />
          </View>
        </View>
      </Modal>

      <Modal visible={isAccountSuspended} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.dialogCard}>
            <Image source={brandMascot.worried} style={styles.mascotIcon} resizeMode="contain" />
            <Text style={styles.dialogTitle}>Account suspended</Text>
            <Text style={styles.dialogMessage}>
              Your staff account has been deactivated. Please contact your supervisor.
            </Text>
            <Button label="Back to sign in" onPress={handleDismissSuspended} style={styles.dialogButton} />
          </View>
        </View>
      </Modal>
    </>
  );
}

export default function RootLayout() {
  return (
    <SessionProvider>
      <RootContent />
    </SessionProvider>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  banner: {
    marginHorizontal: gutter,
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: ui.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  dialogCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: ui.surface,
    borderRadius: radii.lg + 4,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: "center",
  },
  mascotIcon: {
    width: 64,
    height: 64,
    marginBottom: 12,
  },
  dialogTitle: {
    ...type.headline,
    color: ui.text,
    textAlign: "center",
  },
  dialogMessage: {
    ...type.subhead,
    color: ui.textSecondary,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 20,
  },
  dialogButton: {
    alignSelf: "stretch",
  },
});
