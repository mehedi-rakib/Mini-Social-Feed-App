# Mini Social Feed — Mobile

React Native (Expo SDK 57) app: login/signup, a scrollable feed with
like/comment and a username filter, a create-post screen, and push
notifications for likes/comments on your posts via Firebase Cloud Messaging.

> **Push notifications do not work in Expo Go.** This app uses
> `expo-notifications` with native FCM tokens, which requires a custom dev
> client (or a full release build) on a physical Android device with Google
> Play Services.

## 1. Install dependencies

```bash
cd mobile
npm install
```

## 2. Point the app at a backend

Create `mobile/.env`:

```bash
EXPO_PUBLIC_API_URL=https://pricing.mehedirakib.com
```

To run against a local backend instead, use your machine's LAN IP (not
`localhost` — a physical device or emulator can't reach the host's
`127.0.0.1`), e.g. `EXPO_PUBLIC_API_URL=http://192.168.x.x:4000`. See
[`../backend/README.md`](../backend/README.md) to run the backend locally.

## 3. Add Firebase config

Download `google-services.json` for the Android app (package name
`com.mehedirakib.minifeed`) from Firebase Console → Project settings → Your
apps, and place it at `mobile/google-services.json`. It's gitignored and
never committed.

## 4. Run a dev build

Because of the native modules in use (`expo-notifications`,
`expo-dev-client`, `expo-glass-effect`), this project needs a custom
development client — plain Expo Go will not load it.

```bash
npm run android   # expo run:android — builds and installs a dev client on a connected device/emulator
npm run ios       # expo run:ios     — requires Xcode + CocoaPods installed
```

First run builds the native project (`android/`, `ios/` — both gitignored,
regenerated on demand) and can take a few minutes. Subsequent runs reuse the
installed dev client and just start Metro:

```bash
npm start
```

Push notifications additionally require:
- a **physical Android device** with Google Play Services (emulators without
  Play Services can't receive FCM; the iOS Simulator can never receive push
  at all)
- notification permission granted when prompted after login

## 5. Build a release APK

With the native `android/` project generated (step 4 above has already run
`expo run:android` once), either:

```bash
cd android
./gradlew assembleRelease
```

which writes the APK to `android/app/build/outputs/apk/release/` (requires a
release signing config), or build/export it from Android Studio, or via
`eas build -p android --profile preview` if using EAS Build instead. Install
the resulting APK directly on a device, or distribute via a shareable link
(Google Drive, etc).

## Project structure

```
src/
├── app/            expo-router screens: (auth)/, (tabs)/, post/[id]
├── api/            client.ts (fetch wrapper + envelope handling) + one file per resource
├── components/     PostCard, auth form pieces, themed primitives
├── context/         AuthContext — token in SecureStore, restores session on launch
├── hooks/           usePosts / useComments (TanStack Query, optimistic like), useDebouncedValue
├── lib/             notifications.ts (permission + token registration + tap-to-navigate)
└── constants/       theme tokens
```

## Notes

- Auth token is stored in `expo-secure-store`, attached as `Authorization:
  Bearer <token>` on every request; a 401 response clears the session and
  routes back to login.
- The feed is a tablet-aware layout: content is capped at 600px and centered
  on wide screens.
- Like is optimistic — the UI flips immediately and rolls back on error.
