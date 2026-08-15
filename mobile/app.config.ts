import type { ExpoConfig } from "expo/config";

// Never hardcode the API URL in app code - it's injected here from env so a
// single build-time value can be swapped without touching source. Falls back
// to the dev machine's LAN IP (not localhost - a physical device can't reach
// the host's 127.0.0.1) for local testing against `npm run dev` in backend/.
// Replace with the live Vercel URL before producing the release APK.
const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://192.168.0.107:4000";

const config: ExpoConfig = {
  name: "mobile",
  slug: "mobile",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "mobile",
  userInterfaceStyle: "automatic",
  ios: {
    icon: "./assets/expo.icon",
  },
  android: {
    package: "com.mehedirakib.minifeed",
    googleServicesFile: "./google-services.json",
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
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
        backgroundColor: "#208AEF",
        image: "./assets/images/splash-icon.png",
        imageWidth: 76,
      },
    ],
    "expo-secure-store",
    [
      "expo-notifications",
      {
        color: "#208AEF",
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
