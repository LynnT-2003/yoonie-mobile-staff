import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { devicesApi } from "../domain/devices/devices-api";

// Configure foreground notifications presentation
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class PushService {
  private registeredDeviceId: string | null = null;
  private currentPushToken: string | null = null;
  public pushUnavailable = false;
  public pushStatusMessage = "Initialized";

  async register(): Promise<string | null> {
    if (Platform.OS === "web") {
      this.pushUnavailable = true;
      this.pushStatusMessage = "Push notifications not supported on web client";
      return null;
    }

    // Expo Go check (SDK 51+ does not support remote push in Expo Go client)
    const isExpoGo =
      Constants.appOwnership === "expo" ||
      Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

    if (isExpoGo) {
      this.pushUnavailable = true;
      this.pushStatusMessage =
        "Push notifications unavailable in Expo Go. Use a development build or EAS preview build.";
      console.warn(`[PushService] ${this.pushStatusMessage}`);
      return null;
    }

    if (!Device.isDevice) {
      console.log("[PushService] Running on simulator/emulator — mock device token registered");
      const mockToken = "ExponentPushToken[mock-simulator-token-" + Date.now() + "]";
      this.currentPushToken = mockToken;
      try {
        const res = await devicesApi.registerDevice({
          expoPushToken: mockToken,
          platform: Platform.OS as "ios" | "android",
          appVersion: Constants.expoConfig?.version ?? "1.0.0",
        });
        this.registeredDeviceId = res.id;
        this.pushUnavailable = false;
        this.pushStatusMessage = "Simulator mock push registered";
      } catch (err) {
        this.pushUnavailable = true;
        this.pushStatusMessage = "Simulator mock registration skipped";
        console.warn("[PushService] Simulator device registration skipped:", err);
      }
      return mockToken;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        this.pushUnavailable = true;
        this.pushStatusMessage = "Push notification permissions not granted";
        console.warn(`[PushService] ${this.pushStatusMessage}`);
        return null;
      }

      // Must specify EAS projectId for Expo push registration
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId ??
        "b5e11413-41c1-4ca6-a5ce-f8fefd82dbf0";

      const tokenData = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      );

      this.currentPushToken = tokenData.data;

      // Register device on backend via devicesApi
      const res = await devicesApi.registerDevice({
        expoPushToken: tokenData.data,
        platform: Platform.OS as "ios" | "android",
        appVersion: Constants.expoConfig?.version ?? "1.0.0",
      });

      this.registeredDeviceId = res.id;
      this.pushUnavailable = false;
      this.pushStatusMessage = "Registered for notifications";
      return tokenData.data;
    } catch (error) {
      this.pushUnavailable = true;
      this.pushStatusMessage =
        error instanceof Error ? error.message : "Push registration unavailable";
      console.warn("[PushService] Guarded push registration error:", error);
      return null;
    }
  }

  async unregister(): Promise<void> {
    if (this.registeredDeviceId) {
      try {
        await devicesApi.unregisterDevice(this.registeredDeviceId);
      } catch (e) {
        console.warn("[PushService] Failed to unregister device on backend:", e);
      }
    }
    this.registeredDeviceId = null;
    this.currentPushToken = null;
    this.pushStatusMessage = "Unregistered";
  }

  getPushToken(): string | null {
    return this.currentPushToken;
  }

  isUnavailable(): boolean {
    return this.pushUnavailable;
  }

  getStatus(): string {
    return this.pushStatusMessage;
  }

  setupListeners(options: {
    onReceived?: (notification: Notifications.Notification) => void;
    onResponse?: (url: string) => void;
  }): () => void {
    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      options.onReceived?.(notification);
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data && typeof data === "object") {
        const screen =
          (data as Record<string, unknown>).screen ||
          (data as Record<string, unknown>).url;
        if (typeof screen === "string" && options.onResponse) {
          options.onResponse(screen);
        }
      }
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }
}

export const pushService = new PushService();
