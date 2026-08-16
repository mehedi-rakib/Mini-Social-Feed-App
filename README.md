# Mini Social Feed

A lightweight social feed app: post text updates, browse a shared feed,
like/comment on posts, filter the feed by username, and get a push
notification when someone likes or comments on your post.

- **Backend** — Node.js / Express / TypeScript, MySQL via Prisma, JWT auth,
  Firebase Cloud Messaging for push. → [`backend/`](backend/README.md)
- **Mobile** — React Native (Expo), file-based routing, TanStack Query,
  SecureStore auth, native FCM push. → [`mobile/`](mobile/README.md)

## Links

| | |
|---|---|
| Live API | `https://pricing.mehedirakib.com` |
| Android APK | https://drive.google.com/drive/folders/1XCJXZns5o5ioNKWKgTa5Dhc3Q54lZW73?usp=sharing |
| Demo accounts | `demo1` / `demo2` — password `Password123!` |


## Quick start

Backend (full details in [`backend/README.md`](backend/README.md)):

```bash
cd backend
npm install
cp .env.example .env   # fill in DATABASE_URL and FIREBASE_SERVICE_ACCOUNT_B64
npm run db:migrate:deploy
npm run db:seed
npm run dev
```

Mobile (full details in [`mobile/README.md`](mobile/README.md)):

```bash
cd mobile
npm install
echo "EXPO_PUBLIC_API_URL=https://pricing.mehedirakib.com" > .env
# place google-services.json in mobile/ (see mobile/README.md)
npm run android   # builds and installs a dev client — plain Expo Go can't load this app
```

## Architecture notes

- **Response envelope**: every API response is `{ success, data, meta? }` or
  `{ success: false, error: { code, message, details? } }` — see
  [`backend/README.md`](backend/README.md#api) for the full endpoint table
  and error codes.
- **Cursor pagination** on both the feed and comments, newest first.
- **Optimistic likes**: the mobile UI flips the like state immediately and
  rolls back on failure, so interactions feel instant.
- **Self-notification guard**: liking or commenting on your own post never
  triggers a push to yourself.
- **Push delivery**: FCM send is fire-and-forget after the API responds —
  a failed push never fails the like/comment request. Stale device tokens
  (uninstalled app, etc.) are pruned automatically from failed sends.
- **Tablet-aware layout**: feed content is capped at 600px and centered on
  wide screens rather than stretching edge-to-edge.
- **States**: the feed has explicit loading (skeletons), empty, and error
  (with retry) states, not just a spinner.

## Requirements coverage

| Requirement | Status |
|---|---|
| Signup/Login with JWT | ✅ |
| Create post (text, 1–500 chars) | ✅ |
| Feed, paginated, newest first | ✅ |
| Like / unlike | ✅ |
| Comment | ✅ |
| Filter feed by username | ✅ |
| Push notification on like/comment via FCM | ✅ |
| Login & Signup screens | ✅ |
| Feed with like + comment + username filter | ✅ |
| Create-post form | ✅ |
| Push notifications on mobile | ✅ |
