# Gossip Girls — Mobile

React Native (Expo SDK 57) app: login/signup, a scrollable feed with
like/comment, a create-post screen with optional image attachments, 1:1
personal chat, and push notifications for likes/comments/messages via
Firebase Cloud Messaging.

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
`com.mehedirakib.gossipgirls`) from Firebase Console → Project settings →
Your apps, and place it at `mobile/google-services.json`. It's gitignored and
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

## 5. Build a release for the Play Store

Release builds are signed with an upload keystore kept at
`mobile/credentials/` (gitignored, never committed). It's generated once and
reused for every future release — losing it means you can't ship an update to
an already-published app under the same listing, so back up
`mobile/credentials/` somewhere safe (password manager / private cloud
storage) outside this repo.

With the native `android/` project generated (step 4 above has already run
`expo run:android`/`expo prebuild` once):

```bash
cd android
./gradlew bundleRelease
```

writes the signed `.aab` to `android/app/build/outputs/bundle/release/` —
this is the file Play Console expects for a new upload. `./gradlew
assembleRelease` produces a signed `.apk` under
`android/app/build/outputs/apk/release/` instead, for direct sideload
testing.

`android/` is regenerated from scratch by `expo prebuild --clean`, which
wipes the manual signing config wired into `android/app/build.gradle`
(`signingConfigs.release`, reading from `credentials/keystore.properties`).
If you run a clean prebuild, re-add that block before building release — see
the `signingConfigs` block in `android/app/build.gradle` in the last release
build for reference.

## Project structure

```
src/
├── app/            expo-router screens: (auth)/, (tabs)/ (incl. chat list), post/[id], chat/[id]
├── api/            client.ts (fetch wrapper + envelope handling) + one file per resource
├── components/     PostCard, Avatar, auth form pieces, themed primitives
├── context/         AuthContext — token in SecureStore, restores session on launch
├── hooks/           usePosts / useComments / useChat (TanStack Query, optimistic updates), useImagePicker
├── lib/             notifications.ts (permission + token registration + tap-to-navigate)
└── constants/       theme tokens
```

## Notes

- Auth token is stored in `expo-secure-store`, attached as `Authorization:
  Bearer <token>` on every request; a 401 response clears the session and
  routes back to login.
- The feed is a tablet-aware layout: content is capped at 600px and centered
  on wide screens.
- Like/comment/message-send are all optimistic — the UI updates immediately
  and rolls back on error.
- **Images**: picked via `expo-image-picker`, uploaded to the backend first
  (`POST /api/uploads/image`), then the returned relative URL is attached to
  the post/message. `resolveMediaUrl()` in `api/client.ts` resolves that
  relative URL against `EXPO_PUBLIC_API_URL` when rendering.
- **Chat**: no WebSocket — the conversation list and open thread poll on a
  short interval (TanStack Query `refetchInterval`), same idea as the rest of
  the app, plus a push notification (same FCM path as likes/comments) for
  delivery while the app isn't open. Start a chat from the message icon next
  to a `@username` on a post, its detail screen, or a comment — there's no
  separate user-search screen.
- Android's keyboard used to cover the comment/message input at the bottom of
  the screen (`KeyboardAvoidingView`'s `behavior` was unset on Android,
  relying on `windowSoftInputMode="adjustResize"` alone, which doesn't
  reliably resize content under this SDK's edge-to-edge rendering) — fixed by
  using `behavior="height"` on Android everywhere there's a composer.
