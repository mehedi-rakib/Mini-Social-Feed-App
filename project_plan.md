# CLAUDE.md — Mini Social Feed App

> Drop this file in the repo root. Claude Code reads it automatically.
> Work through **PHASES** in order. Do not skip ahead. Tick boxes as you go.

---

## 1. What this is

A job assessment. A reviewer will clone the GitHub repo, read the README, install an APK on a real Android phone and a tablet, and test it. Everything must work with **zero setup on their side**.

**Deliverables (exactly these, nothing more):**
1. GitHub repo with `/backend` and `/mobile` folders + root README
2. Backend deployed live (Vercel)
3. Android APK on Google Drive, link set to "anyone with the link"

**There is NO web frontend.** The brief's evaluation criteria mentions a "web interface" but that is template leftover — the deliverables list only backend + Expo app + APK. Build Android only.

**What is graded:**

| Criterion | What the reviewer actually checks |
|---|---|
| Code Quality | Modular folders, TypeScript, no dead code, README API docs |
| API Design | Consistent response shape, validation on every input, auth enforced |
| Mobile App | Feed scrolls smoothly, **push notifications actually arrive** |
| Extra points | Tablet layout, error/empty/loading states |

---

## 2. GOLDEN RULES — violating any of these fails the submission

1. **Never hardcode `localhost` in the mobile app.** Deploy the backend on day one; the app points at the live HTTPS URL from the very first screen.
2. **Never commit** `serviceAccountKey.json`, `google-services.json` secrets, or `.env`. Add to `.gitignore` BEFORE downloading them.
3. **Push notifications do not work in Expo Go.** A dev build is required. Test on a physical device with Google Play Services.
4. **Never notify a user about their own like/comment.** Reviewer will test this.
5. **Lock the Android package name on day one** (`com.mehedirakib.minisocial`). Changing it later invalidates `google-services.json`.
6. **`src/app.ts` must not call `.listen()`** — Vercel imports the app. Only `src/server.ts` listens, for local dev.
7. Every response uses the envelope in §6. No exceptions.
8. TypeScript everywhere. No `.js` source files.

---

## 3. Stack (locked — do not substitute)

**Backend:** Node 20 + Express 5 + TypeScript + Firestore (Native mode) + `firebase-admin` + Zod + bcryptjs + JWT
**Hosting:** Vercel (serverless functions)
**Mobile:** Expo SDK 52+ (dev build) + expo-router + TanStack Query + expo-notifications + expo-secure-store
**Push:** Native FCM token → `firebase-admin` `sendEachForMulticast`
**Build:** EAS Build, `preview` profile → APK

**Why Firestore over Postgres:** Vercel serverless functions destroy Postgres connection pools. Firestore is HTTP-based — nothing to pool. Also, FCM is already required, so it's one project and one credential set.

**Why native FCM token over Expo Push Service:** the brief says "Use Firebase Cloud Messaging." Using `firebase-admin` directly matches the requirement literally and removes a third-party dependency from the critical path.

---

## 4. Repo structure

```
mini-social-feed/
├── README.md                    ← root: overview + links + demo accounts
├── .gitignore
├── backend/
│   ├── api/index.ts             ← Vercel entry (exports app)
│   ├── src/
│   │   ├── app.ts               ← express app, NO .listen()
│   │   ├── server.ts            ← local dev only
│   │   ├── lib/
│   │   │   ├── firebase.ts      ← admin init, db, messaging, COL
│   │   │   └── env.ts           ← zod-validated env vars
│   │   ├── middleware/
│   │   │   ├── auth.ts          ← JWT verify → req.user
│   │   │   ├── validate.ts      ← zod body/query validator
│   │   │   └── error.ts         ← global error handler
│   │   ├── modules/
│   │   │   ├── auth/            ← controller, service, schema, routes
│   │   │   ├── posts/
│   │   │   ├── likes/
│   │   │   ├── comments/
│   │   │   ├── devices/
│   │   │   └── notifications/   ← FCM send service
│   │   ├── utils/
│   │   │   ├── ApiError.ts
│   │   │   ├── response.ts      ← ok() / fail()
│   │   │   └── asyncHandler.ts
│   │   └── seed.ts              ← creates demo accounts + posts
│   ├── firestore.indexes.json
│   ├── firestore.rules
│   ├── vercel.json
│   ├── .env.example
│   ├── tsconfig.json
│   └── package.json
└── mobile/
    ├── app/                     ← expo-router
    │   ├── _layout.tsx
    │   ├── (auth)/login.tsx
    │   ├── (auth)/signup.tsx
    │   ├── (tabs)/_layout.tsx
    │   ├── (tabs)/index.tsx     ← feed
    │   ├── (tabs)/create.tsx
    │   └── post/[id].tsx        ← post + comments
    ├── src/
    │   ├── api/                 ← client.ts + endpoint fns
    │   ├── components/
    │   ├── hooks/
    │   ├── context/AuthContext.tsx
    │   └── lib/notifications.ts
    ├── assets/
    ├── google-services.json     ← gitignored
    ├── app.json
    ├── eas.json
    └── package.json
```

---

## 5. Data model (Firestore)

Four collections. **No separate `devices` collection** — FCM tokens live as an array on the user doc.

```
users/{userId}
  username         string
  usernameLower    string     ← for case-insensitive filter + uniqueness
  email            string
  emailLower       string
  passwordHash     string
  displayName      string
  fcmTokens        string[]   ← device push tokens
  createdAt        Timestamp

posts/{postId}
  content              string   (1–500 chars)
  authorId             string
  authorUsername       string   ← denormalized (Firestore has no joins)
  authorUsernameLower  string   ← powers the username filter
  likeCount            number
  commentCount         number
  createdAt            Timestamp

likes/{postId}_{userId}          ← composite doc ID = uniqueness for free
  postId, userId, createdAt

posts/{postId}/comments/{commentId}
  content   string (1–1000 chars)
  userId    string
  username  string   ← denormalized
  createdAt Timestamp
```

**Design decisions to state in the README:**
- Composite like ID makes double-tap idempotent with no transaction.
- `likeCount`/`commentCount` denormalized → feed is one query, not N aggregates. Updated via `FieldValue.increment()` inside a batch.
- `authorUsername` denormalized → rendering 10 posts is 1 read, not 11.
- Tradeoff: Firestore caps ~1 write/sec per document, so counters would need sharding at scale. Acceptable here; mention it.

---

## 6. API contract

Base URL: `https://<project>.vercel.app`
Auth header: `Authorization: Bearer <token>`

**Every response:**
```jsonc
// success
{ "success": true, "data": { ... }, "meta": { ... } }   // meta optional
// error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }
```

Error codes: `VALIDATION_ERROR` 400 · `UNAUTHORIZED` 401 · `FORBIDDEN` 403 · `NOT_FOUND` 404 · `CONFLICT` 409 · `RATE_LIMITED` 429 · `INTERNAL` 500

| Method | Path | Auth | Body / Query |
|---|---|---|---|
| GET | `/health` | – | – |
| POST | `/api/auth/signup` | – | `{username, email, password, displayName?}` |
| POST | `/api/auth/login` | – | `{email, password}` |
| GET | `/api/auth/me` | ✔ | – |
| GET | `/api/posts` | ✔ | `?limit=10&cursor=<postId>&username=<name>` |
| POST | `/api/posts` | ✔ | `{content}` |
| GET | `/api/posts/:id` | ✔ | – |
| POST | `/api/posts/:id/like` | ✔ | – (toggle) |
| POST | `/api/posts/:id/comment` | ✔ | `{content}` |
| GET | `/api/posts/:id/comments` | ✔ | `?limit=20&cursor=<commentId>` |
| POST | `/api/devices` | ✔ | `{token, platform:"ANDROID"}` |
| DELETE | `/api/devices` | ✔ | `{token}` — called on logout |
| GET | `/api/notifications` | ✔ | `?limit=20` (optional, nice-to-have) |

**Key response shapes:**

```jsonc
// POST /api/auth/login
{ "success": true, "data": {
    "token": "eyJ...",
    "user": { "id": "...", "username": "rakib", "email": "...", "displayName": "..." }
}}

// GET /api/posts
{ "success": true,
  "data": [{
    "id": "...", "content": "...",
    "author": { "id": "...", "username": "rakib", "displayName": "..." },
    "likeCount": 3, "commentCount": 1,
    "likedByMe": true,
    "createdAt": "2026-08-15T10:00:00.000Z"
  }],
  "meta": { "nextCursor": "postId_or_null", "hasMore": true }
}

// POST /api/posts/:id/like
{ "success": true, "data": { "liked": true, "likeCount": 4 } }
```

**Feed algorithm (important):**
1. Query `posts` ordered by `createdAt` desc, limit N (+ `where authorUsernameLower == filter` if provided)
2. Collect post IDs, then ONE query: `likes where userId == me and postId in [...ids]`
3. Map `likedByMe` in memory

Firestore's `in` operator caps at 30 values — keep `limit` ≤ 20 (default 10).

---

## 7. PHASES

### PHASE 0 — Foundations (~1h)

- [ ] Create GitHub repo `mini-social-feed`, clone locally
- [ ] Root `.gitignore`: `node_modules`, `.env*` (except `.env.example`), `dist`, `*serviceAccount*.json`, `google-services.json`, `.expo`
- [ ] **Commit the .gitignore first.** Before any credential touches the disk.
- [ ] Firebase console → new project `mini-social-feed`
- [ ] Enable **Firestore in Native mode**, region `asia-south1` (closest to Dhaka)
- [ ] Add **Android app**, package name `com.mehedirakib.minisocial` → download `google-services.json` → park it in `mobile/`
- [ ] Project settings → Service accounts → Generate new private key → save OUTSIDE the repo
- [ ] `base64 -w 0 serviceAccountKey.json` → copy the string

**Done when:** repo exists, credentials downloaded, nothing secret is tracked by git (`git status` proves it).

---

### PHASE 1 — Backend scaffold + live deploy (~2h)

Deploy an empty app FIRST. Getting a live URL on day one removes the biggest submission risk.

- [ ] `cd backend && npm init -y`
- [ ] Install:
  ```bash
  npm i express@5 firebase-admin zod bcryptjs jsonwebtoken helmet cors express-rate-limit dotenv
  npm i -D typescript tsx @types/node @types/express @types/bcryptjs @types/jsonwebtoken @types/cors
  ```
- [ ] `npx tsc --init` → set `"target":"ES2022"`, `"module":"NodeNext"`, `"moduleResolution":"NodeNext"`, `"outDir":"dist"`, `"rootDir":"."`, `"strict":true`, `"esModuleInterop":true`
- [ ] `package.json` scripts:
  ```json
  { "dev":"tsx watch src/server.ts", "build":"tsc", "start":"node dist/server.js", "seed":"tsx src/seed.ts" }
  ```
- [ ] `src/lib/env.ts` — Zod-validate `FIREBASE_SERVICE_ACCOUNT_B64`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `NODE_ENV`. Throw loudly at boot if missing.
- [ ] `src/lib/firebase.ts` — init guarded by `getApps().length` (Vercel reuses warm containers), export `db`, `messaging`, `COL`, `likeId()`. Call `db.settings({ ignoreUndefinedProperties: true })`.
- [ ] `src/utils/` — `ApiError`, `ok()`, `fail()`, `asyncHandler`
- [ ] `src/middleware/error.ts` — maps `ApiError` and `ZodError` to the envelope; logs stack; never leaks stack in production
- [ ] `src/app.ts` — `helmet()`, `cors()`, `express.json({limit:'100kb'})`, rate limiter on `/api/auth/*` (10 req/15min), routes, 404 handler, error handler. **Export default app. No `.listen()`.**
- [ ] `src/server.ts` — imports app, `.listen(PORT)`
- [ ] `api/index.ts` — `import app from "../src/app"; export default app;`
- [ ] `vercel.json` — `{ "rewrites": [{ "source": "/(.*)", "destination": "/api" }] }`
- [ ] `GET /health` → `{ success: true, data: { status: "ok" } }`
- [ ] Push to GitHub → import to Vercel → **root directory = `backend`**
- [ ] Add env vars in Vercel (Production scope): `FIREBASE_SERVICE_ACCOUNT_B64`, `JWT_SECRET` (`openssl rand -base64 32`), `JWT_EXPIRES_IN=7d`, `NODE_ENV=production`
- [ ] Deploy

**Done when:** `curl https://<project>.vercel.app/health` returns the envelope. **Write that URL down — the mobile app uses it from the start.**

---

### PHASE 2 — Auth module (~3h)

- [ ] `firestore.rules` — deny all client access (Admin SDK bypasses rules; the API is the only writer). Deploy it.
  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /{document=**} { allow read, write: if false; }
    }
  }
  ```
- [ ] `modules/auth/auth.schema.ts` — Zod: username `3–20`, `/^[a-zA-Z0-9_]+$/`; email; password min 8
- [ ] `modules/auth/auth.service.ts`
  - signup: check `usernameLower` + `emailLower` uniqueness → 409 `CONFLICT` if taken; bcrypt hash (rounds 10); create user with `fcmTokens: []`; sign JWT
  - login: lookup by `emailLower`; `bcrypt.compare`; **return the same generic message for wrong email and wrong password** (no user enumeration)
- [ ] `middleware/auth.ts` — parse Bearer, `jwt.verify`, attach `req.user = {id, username}`, 401 on failure
- [ ] `modules/auth/auth.routes.ts` → mount at `/api/auth`
- [ ] `src/seed.ts` — creates `demo1` / `demo2` with password `Password123!` and 5 posts

**Done when:** signup → login → `GET /api/auth/me` with the token works against the **deployed** URL. Duplicate username returns 409. No-token request returns 401.

---

### PHASE 3 — Posts, likes, comments (~4h)

- [ ] `POST /api/posts` — validate 1–500 chars, trim, reject whitespace-only; write with denormalized author fields and zeroed counters
- [ ] `GET /api/posts` — cursor pagination (`startAfter` on the cursor doc), newest first, optional `username` filter on `authorUsernameLower`; batch-resolve `likedByMe` (§6)
- [ ] `firestore.indexes.json` — composite indexes:
  - `posts`: `authorUsernameLower` ASC + `createdAt` DESC
  - `likes`: `userId` ASC + `postId` ASC
- [ ] `firebase deploy --only firestore:indexes` — **do this now**, builds take minutes
- [ ] `POST /api/posts/:id/like` — toggle. Read `likes/{postId}_{userId}`; if exists → batch delete + `increment(-1)`; else → batch create + `increment(1)`. Return `{liked, likeCount}`. 404 if post missing.
- [ ] `POST /api/posts/:id/comment` — validate 1–1000; batch: create subcollection doc + `increment(commentCount)`
- [ ] `GET /api/posts/:id/comments` — paginated, newest first
- [ ] `GET /api/posts/:id` — single post with `likedByMe`

**Done when:** in Postman — create post, like it twice (count goes 1 → 0), comment, paginate to page 2, filter by username. All against the live URL.

---

### PHASE 4 — FCM notifications (~2h)

- [ ] `POST /api/devices` — `FieldValue.arrayUnion(token)` on the user doc (idempotent)
- [ ] `DELETE /api/devices` — `arrayRemove(token)`
- [ ] `modules/notifications/notification.service.ts`:
  ```
  notify({ recipientId, actorUsername, type, postId, postPreview })
    → if recipientId === actorId: RETURN (never self-notify)
    → read recipient's fcmTokens; if empty, return
    → messaging.sendEachForMulticast({
        tokens,
        notification: { title, body },
        data: { type, postId },          // strings only
        android: { priority: 'high' }
      })
    → inspect responses; arrayRemove tokens erroring with
      'messaging/registration-token-not-registered'
  ```
- [ ] Copy: like → `"{actor} liked your post"` · comment → `"{actor} commented: {first 60 chars}"`
- [ ] Call `notify()` from the like and comment handlers — **after** the batch commits, and **never `await` it in a way that blocks the response**. Fire it, catch errors, log them. A failed push must not fail the API call.

**Done when:** the FCM send call returns `successCount > 0` in Vercel logs. Full end-to-end verification happens in Phase 7.

---

### PHASE 5 — Mobile app (~7h)

- [ ] `npx create-expo-app mobile --template` (blank TypeScript), install expo-router, TanStack Query, expo-secure-store, expo-notifications, expo-device
- [ ] `app.json`:
  ```jsonc
  {
    "expo": {
      "android": {
        "package": "com.mehedirakib.minisocial",
        "googleServicesFile": "./google-services.json",
        "edgeToEdgeEnabled": true
      },
      "plugins": ["expo-router", "expo-notifications", "expo-secure-store"],
      "extra": { "apiUrl": "https://<project>.vercel.app" }
    }
  }
  ```
- [ ] `src/api/client.ts` — read base URL from `Constants.expoConfig.extra.apiUrl`, **never hardcode**. Attach Bearer token, unwrap the envelope, throw typed errors, 401 → clear session and redirect to login.
- [ ] `AuthContext` — token in SecureStore, restore on launch (splash until resolved), `login`/`signup`/`logout`
- [ ] Login + Signup screens: inline field errors, disabled button while pending, keyboard avoiding
- [ ] Feed (`(tabs)/index.tsx`): `FlatList` + `useInfiniteQuery`, pull-to-refresh, debounced (400ms) username search input, `keyExtractor`, memoized `PostCard`
- [ ] `PostCard`: author, relative time, content, like button (filled when `likedByMe`), counts, comment button
- [ ] Optimistic like: update cache immediately in `onMutate`, roll back in `onError`
- [ ] Create Post screen: multiline input, live char counter (`n/500`), submit disabled when empty or over limit, invalidate feed and navigate back on success
- [ ] Post detail (`post/[id].tsx`): post + comments list + comment composer pinned above the keyboard
- [ ] `expo-dev-client` installed; run `eas build -p android --profile development` once and install it — **Expo Go cannot receive FCM pushes**

**Done when:** the whole flow works on a physical device against the live backend. Two accounts on two devices (or one device + Postman) see each other's posts.

---

### PHASE 6 — Push wiring + polish (~4h)

Push:
- [ ] `lib/notifications.ts`:
  - `requestPermissions()` — call **after** login, not on cold start
  - Android: `setNotificationChannelAsync('default', { importance: MAX })` — required or notifications are silent
  - `getDevicePushTokenAsync()` → `.data` is the **native FCM token** → `POST /api/devices`
  - `addPushTokenListener` → re-register on rotation
  - `setNotificationHandler` → show alert in foreground
  - `addNotificationResponseReceivedListener` → tap navigates to `post/[id]` using `data.postId`
- [ ] `DELETE /api/devices` on logout

Polish (this is the "extra points" section — do not skip):
- [ ] Skeleton loaders on first feed load
- [ ] Empty state ("No posts yet — be the first")
- [ ] Error state with a Retry button
- [ ] **Tablet:** wrap feed content in a container with `maxWidth: 600, alignSelf: 'center'` — they explicitly said they test on tablet
- [ ] `SafeAreaView` / `useSafeAreaInsets` on every screen
- [ ] App icon + splash screen
- [ ] Toast/inline feedback on post-create success and network failure

**Done when:** app closed → account B likes account A's post → notification arrives on A's device → tapping it opens that post.

---

### PHASE 7 — Build, document, submit (~3h)

- [ ] `eas.json` preview profile:
  ```json
  { "build": { "preview": { "distribution": "internal",
      "android": { "buildType": "apk" } } } }
  ```
- [ ] Upload FCM V1 service account JSON to EAS credentials (`eas credentials` → Android → Push Notifications)
- [ ] `eas build -p android --profile preview` → download APK
- [ ] Upload APK to Google Drive → **share: Anyone with the link** → verify in an incognito window
- [ ] Run `npm run seed` against production
- [ ] Root `README.md`:
  - Project overview + screenshots (feed, post detail, notification)
  - Live API base URL + APK Drive link
  - **Demo accounts with passwords**
  - Backend setup: clone, `npm i`, `.env` keys explained, `npm run dev`
  - Mobile setup: `npm i`, where to put `google-services.json`, dev build command
  - **Full API table** with request/response samples (copy §6)
  - Architecture notes: why Firestore, why denormalized counters, why native FCM token, the write-rate tradeoff
  - Note: "Push notifications require a physical Android device with Google Play Services; they do not work in Expo Go or a bare emulator."

**Final checks — walk through as if you were the reviewer:**
- [ ] `git log -p | grep -i "private_key"` returns nothing
- [ ] Fresh clone → follow your own README → backend runs
- [ ] APK installs on a phone that has never seen this project → signup → post → works
- [ ] Notification lands with the app **fully killed**
- [ ] Tablet screenshot doesn't look like a stretched phone
- [ ] Every endpoint in the README actually exists and matches its documented response
- [ ] Repo has no `node_modules`, no `.env`, no `dist`

---

## 8. Code conventions

- Modules are `{name}.routes.ts` / `.controller.ts` / `.service.ts` / `.schema.ts`. Controllers stay thin — no Firestore calls in controllers.
- Every handler wrapped in `asyncHandler`. Never `try/catch` for control flow; throw `ApiError` and let the global handler format it.
- Every request body and query string goes through a Zod schema via `validate` middleware. No manual `if (!req.body.x)`.
- Firestore `Timestamp` → ISO string at the serialization boundary. The API never leaks Firestore types.
- Never return `passwordHash` or `fcmTokens` in any response. Use an explicit `toPublicUser()` mapper.
- Mobile: no business logic in screen components. Data lives in `src/api` + hooks.
- Commit messages: `feat(posts): add cursor pagination`. The reviewer reads the git log.

---

## 9. Known traps

| Trap | Fix |
|---|---|
| Vercel 500 on every route | `src/app.ts` called `.listen()` — remove it |
| `The default Firebase app already exists` | Guard init with `getApps().length` |
| Private key `\n` errors on Vercel | Use base64 env var, decode at runtime |
| `FAILED_PRECONDITION: index required` | Deploy `firestore.indexes.json`, wait for the build |
| Push silently never arrives | Missing Android notification channel, or testing in Expo Go |
| `in` query throws | More than 30 IDs — cap page size at 20 |
| APK opens but nothing loads | App still pointing at localhost |
| Reviewer can't download APK | Drive link not set to "anyone with the link" |

---

## 10. Progress tracker

- [ ] Phase 0 — Foundations
- [ ] Phase 1 — Backend scaffold + live deploy
- [ ] Phase 2 — Auth
- [ ] Phase 3 — Posts / likes / comments
- [ ] Phase 4 — FCM
- [ ] Phase 5 — Mobile app
- [ ] Phase 6 — Push wiring + polish
- [ ] Phase 7 — Build, document, submit