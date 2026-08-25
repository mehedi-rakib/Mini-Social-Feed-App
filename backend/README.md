# Mini Social Feed — Backend

Node.js 20 + Express 5 + TypeScript. Data lives in **MySQL via Prisma**;
**Firebase Admin SDK is used only for push notifications (FCM)** — there is no
Firestore involved.

Live instance: `https://pricing.mehedirakib.com`

## Stack

- Express 5, TypeScript (`NodeNext` modules)
- Prisma ORM + MySQL
- JWT auth (`jsonwebtoken` + `bcryptjs`)
- Zod request validation
- `firebase-admin` — Cloud Messaging only, for like/comment/message push notifications
- `multer` — local-disk image uploads, served back as static files
- `express-rate-limit`, `helmet`, `cors`

## 1. Install

```bash
cd backend
npm install
```

## 2. Configure environment

Copy the example file and fill in the values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | MySQL connection string, e.g. `mysql://USER:PASSWORD@localhost:3306/mini_social` |
| `FIREBASE_SERVICE_ACCOUNT_B64` | Base64-encoded Firebase service account JSON (FCM only — see below) |
| `JWT_SECRET` | Random secret used to sign auth tokens |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `NODE_ENV` | `development` \| `production` \| `test` |
| `PORT` | Port for local dev (default `4000`) |

**Getting `FIREBASE_SERVICE_ACCOUNT_B64`:** Firebase Console → Project settings
→ Service accounts → **Generate new private key**, then base64-encode the
downloaded JSON:

```bash
npm run db:env -- ./path/to/serviceAccountKey.json
```

This writes `FIREBASE_SERVICE_ACCOUNT_B64` into `backend/.env` (creating it if
needed) and fills in a generated `JWT_SECRET` plus sane defaults for the rest.
It leaves `DATABASE_URL` as a placeholder for you to fill in with your real
MySQL connection string. **Never commit the service account JSON or `.env`** —
both are gitignored.

## 3. Set up the database

```bash
npm run db:migrate:deploy   # apply Prisma migrations
npm run db:seed             # optional: demo accounts + sample posts
```

Demo accounts created by the seed script: `demo1@example.com` /
`demo2@example.com`, password `Password123!`. Login is by email, not
username.

For local development iteration (creates new migrations from schema changes):

```bash
npm run db:migrate          # prisma migrate dev
```

### Upgrading an existing deployment (device table migration)

Push tokens used to live as a JSON array on `users.fcmTokens`. That's now a
proper `devices` table (one row per physical device, so a device that logs
into a different account doesn't keep leaking notifications to the old one).
If you're deploying on top of an existing database, run these **in order**:

```bash
npm run db:migrate:deploy         # applies the migration that adds `devices` (fcmTokens still present)
npm run db:backfill-devices       # copies existing fcmTokens rows into `devices`
npm run db:migrate:deploy         # applies the second migration that drops `fcmTokens`
```

A brand-new database just needs the normal `npm run db:migrate:deploy` — both
migrations apply back to back and there's nothing to backfill.

### Uploaded images

`POST /api/uploads/image` writes files to `backend/uploads/` and they're
served back at `/uploads/<file>`. That directory needs to exist and be
writable by the Node process on whatever host runs the server — it's created
automatically on startup if missing, but on a re-deployed/ephemeral host
(containers, serverless) local disk won't persist and this needs to point at
a real volume or be swapped for object storage instead.

## 4. Run it

```bash
npm run dev      # local dev with hot reload, http://localhost:4000
npm run build     # compile to dist/
npm start         # run compiled output
```

`GET /health` should return `{ "success": true, "data": { "status": "ok" } }`.

## One-liner after steps 1–2

```bash
npm run db:migrate:deploy && npm run db:seed && npm run dev
```

---

## API

Base URL (local): `http://localhost:4000`
Base URL (live): `https://pricing.mehedirakib.com`

All authenticated routes require `Authorization: Bearer <token>`.

### Response envelope

Every response follows the same shape:

```jsonc
// success
{ "success": true, "data": { ... }, "meta": { ... } }   // meta only on paginated endpoints

// error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }
```

| Error code | HTTP status |
|---|---|
| `VALIDATION_ERROR` | 400 |
| `UNAUTHORIZED` | 401 |
| `FORBIDDEN` | 403 |
| `NOT_FOUND` | 404 |
| `CONFLICT` | 409 |
| `RATE_LIMITED` | 429 |
| `INTERNAL` | 500 |

### Endpoints

| Method | Path | Auth | Body / Query |
|---|---|---|---|
| GET | `/health` | – | – |
| POST | `/api/auth/signup` | – | `{ username, email, password, displayName? }` |
| POST | `/api/auth/login` | – | `{ email, password }` |
| GET | `/api/auth/me` | ✔ | – |
| GET | `/api/posts` | ✔ | `?limit=10&cursor=<postId>&username=<name>` |
| POST | `/api/posts` | ✔ | `{ content, imageUrl? }` |
| GET | `/api/posts/:id` | ✔ | – |
| POST | `/api/posts/:id/like` | ✔ | – (toggles like/unlike) |
| POST | `/api/posts/:id/comment` | ✔ | `{ content }` |
| GET | `/api/posts/:id/comments` | ✔ | `?limit=20&cursor=<commentId>` |
| POST | `/api/uploads/image` | ✔ | multipart, field name `image` (jpeg/png/webp, max 5MB) → `{ url }` |
| POST | `/api/devices` | ✔ | `{ token, platform?: "ANDROID" \| "IOS" }` — register a push token for this device |
| DELETE | `/api/devices` | ✔ | `{ token }` — call on logout |
| GET | `/api/conversations` | ✔ | this user's conversations, newest first |
| POST | `/api/conversations` | ✔ | `{ userId }` — find-or-create a 1:1 conversation |
| GET | `/api/conversations/:id` | ✔ | – |
| GET | `/api/conversations/:id/messages` | ✔ | `?limit=30&cursor=<messageId>` |
| POST | `/api/conversations/:id/messages` | ✔ | `{ content?, imageUrl? }` — at least one required |

**Validation:**
- `username`: 3–20 chars, letters/numbers/underscore only
- `password`: min 8 chars
- post `content`: 1–500 chars, trimmed
- comment `content`: 1–1000 chars, trimmed
- message `content`: 1–2000 chars, trimmed (or an `imageUrl`, or both)
- `limit` on `/api/posts`: 1–20 (default 10); on `/api/posts/:id/comments`: 1–50 (default 20); on
  `/api/conversations/:id/messages`: 1–50 (default 30)

### Sample requests/responses

```jsonc
// POST /api/auth/signup
// body: { "username": "rakib", "email": "rakib@example.com", "password": "Password123!" }
{ "success": true, "data": {
    "token": "eyJ...",
    "user": { "id": "...", "username": "rakib", "email": "rakib@example.com", "displayName": "rakib" }
}}

// GET /api/posts?limit=10
{ "success": true,
  "data": [{
    "id": "...", "content": "Hello world",
    "author": { "id": "...", "username": "demo1" },
    "likeCount": 3, "commentCount": 1,
    "likedByMe": true,
    "createdAt": "2026-08-15T10:00:00.000Z"
  }],
  "meta": { "nextCursor": "postId_or_null", "hasMore": true }
}

// POST /api/posts/:id/like
{ "success": true, "data": { "liked": true, "likeCount": 4 } }
```

### Notifications (FCM)

Liking or commenting on someone else's post, or sending them a chat message,
triggers a push notification to every device registered on that user's
account (via `POST /api/devices`). A user never gets notified for their own
like/comment/message. Push is fired after the response is sent and never
blocks or fails the API call — delivery errors are logged, and tokens
Firebase reports as `registration-token-not-registered` are pruned
automatically (the corresponding `devices` row is deleted).

---

## Design notes

- **Cursor pagination**: `cursor` is the last item's `id` from the previous
  page; `hasMore`/`nextCursor` come back in `meta`.
- **Rate limiting**: global `/api` limiter (300 req/15min), tighter limits on
  `/api/auth/signup` (10/hr/IP), `/api/auth/login` (5/15min/IP), and writes
  — post/like/comment/device — (20/min, per user once authenticated). Note:
  the in-memory store is per-instance, so on a multi-instance deployment this
  is a best-effort defense rather than a hard guarantee.
- **Auth**: same generic "Invalid email or password" message on wrong email
  vs. wrong password, to avoid user enumeration.
- **Modules**: each domain (`auth`, `posts`, `likes`, `comments`, `devices`,
  `chat`, `notifications`) has `.routes.ts` / `.controller.ts` /
  `.service.ts` / `.schema.ts` (`uploads` skips `.service.ts`/`.schema.ts` —
  there's no database involved, just multer + a static path). Controllers
  stay thin; all data access lives in services.
- **Devices**: `devices.token` is globally unique, not scoped per user —
  registering a token always reassigns it to whoever's currently logged in
  on that device (upsert by token), instead of leaking notifications to
  whichever account registered it first. One account can have any number of
  device rows.
- **Chat**: a `Conversation` row's `userAId`/`userBId` are the two
  participant ids sorted lexicographically, so there's exactly one
  conversation per pair regardless of who starts it (`@@unique([userAId,
  userBId])`). `lastMessagePreview`/`lastMessageAt` are denormalized onto the
  conversation (same idea as `Post.likeCount`) so the conversation list is a
  single cheap query.
