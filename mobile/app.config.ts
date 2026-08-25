import type { ExpoConfig } from "expo/config";

// Never hardcode the API URL in app code - it's injected here from env so a
// single build-time value can be swapped without touching source. Set in
// mobile/.env; defaults to the live backend at pricing.mehedirakib.com.
const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "https://pricing.mehedirakib.com";

const config: ExpoConfig = {
  name: "Dostagram",
  slug: "gossip-girls",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "gossip-girls",
  userInterfaceStyle: "automatic",
  ios: {
    icon: "./assets/expo.icon",
  },
  android: {
    package: "com.mehedirakib.gossipgirls",
    googleServicesFile: "./google-services.json",
    adaptiveIcon: {
      backgroundColor: "#FCE4EC",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#E1306C",
        image: "./assets/images/splash-icon.png",
        imageWidth: 76,
      },
    ],
    "expo-secure-store",
    [
      "expo-notifications",
      {
        color: "#E1306C",
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission: "Allow Dostagram to access your photos to attach images to posts and messages.",
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          enableProguardInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    apiUrl,
  },
};

export default config;
