import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { router } from "expo-router";
import * as devicesApi from "@/api/devices";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let currentToken: string | null = null;

export async function setupPushNotifications(): Promise<void> {
  if (!Device.isDevice) {
    console.warn("Push notifications require a physical device.");
    return;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== "granted") {
    console.warn("Push notification permission not granted.");
    return;
  }

  const { data: token } = await Notifications.getDevicePushTokenAsync();
  currentToken = token;
  await devicesApi.registerDevice(token).catch((err) => console.error("registerDevice failed:", err));

  Notifications.addPushTokenListener(async (newToken) => {
    currentToken = newToken.data;
    await devicesApi.registerDevice(newToken.data).catch((err) => console.error("registerDevice failed:", err));
  });

  Notifications.addNotificationResponseReceivedListener((response) => {
    const postId = response.notification.request.content.data?.postId as string | undefined;
    if (postId) {
      router.push(`/post/${postId}`);
    }
  });
}

export async function teardownPushNotifications(): Promise<void> {
  if (currentToken) {
    await devicesApi.unregisterDevice(currentToken).catch((err) => console.error("unregisterDevice failed:", err));
    currentToken = null;
  }
}
