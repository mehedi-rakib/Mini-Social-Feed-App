import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { router } from "expo-router";
import * as devicesApi from "@/api/devices";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let currentToken: string | null = null;
let tokenSubscription: Notifications.Subscription | null = null;
let responseSubscription: Notifications.Subscription | null = null;

export async function setupPushNotifications(): Promise<void> {
  // iOS simulators can never receive real push, so skip there. Android
  // emulators with Google Play Services *can* receive FCM, so only iOS
  // is gated on Device.isDevice.
  if (Platform.OS === "ios" && !Device.isDevice) {
    console.warn("Push notifications require a physical device.");
    return;
  }

  // Clear existing listeners if any (safety against multiple calls)
  removeListeners();

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;

  // Use granular iOS status if available
  if (Platform.OS === "ios" && existing.ios) {
    status =
      existing.ios.status === Notifications.IosAuthorizationStatus.AUTHORIZED
        ? Notifications.PermissionStatus.GRANTED
        : Notifications.PermissionStatus.DENIED;
  }

  if (status !== Notifications.PermissionStatus.GRANTED) {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
    if (Platform.OS === "ios" && requested.ios) {
      status =
        requested.ios.status === Notifications.IosAuthorizationStatus.AUTHORIZED
          ? Notifications.PermissionStatus.GRANTED
          : Notifications.PermissionStatus.DENIED;
    }
  }

  if (status !== Notifications.PermissionStatus.GRANTED) {
    console.warn("Push notification permission not granted.");
    return;
  }

  try {
    const { data: token } = await Notifications.getDevicePushTokenAsync();
    currentToken = token;
    const platform = Platform.OS.toUpperCase();
    await devicesApi.registerDevice(token, platform).catch((err) => console.error("registerDevice failed:", err));

    tokenSubscription = Notifications.addPushTokenListener(async (newToken) => {
      currentToken = newToken.data;
      await devicesApi.registerDevice(newToken.data, platform).catch((err) => console.error("registerDevice failed:", err));
    });

    responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const postId = response.notification.request.content.data?.postId as string | undefined;
      if (postId) {
        router.push(`/post/${postId}`);
      }
    });
  } catch (error) {
    console.error("Failed to setup push notifications:", error);
  }
}

function removeListeners() {
  if (tokenSubscription) {
    tokenSubscription.remove();
    tokenSubscription = null;
  }
  if (responseSubscription) {
    responseSubscription.remove();
    responseSubscription = null;
  }
}

export async function teardownPushNotifications(): Promise<void> {
  removeListeners();
  if (currentToken) {
    await devicesApi.unregisterDevice(currentToken).catch((err) => console.error("unregisterDevice failed:", err));
    currentToken = null;
  }
}
