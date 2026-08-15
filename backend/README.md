# Backend setup

Node 20 + Express 5 + TypeScript + Firestore. This is Firestore, not SQL - there
are no schema migrations to run against tables. The two things that stand in
for "migrations" here are:

- **`firestore.rules`** - access control (deployed to the project)
- **`firestore.indexes.json`** - composite indexes Firestore needs for the
  queries this API runs (deployed to the project)

The database "schema" (collection shapes) lives in code as the single source
of truth: [`src/lib/schema.ts`](src/lib/schema.ts).

## 1. Install

```bash
cd backend
npm install
```

## 2. Get a service account key

Firebase Console -> Project settings -> Service accounts -> **Generate new
private key**. Save the downloaded JSON anywhere (dropping it in this
`backend/` folder is fine - it's gitignored by filename pattern
`*firebase-adminsdk*.json`). **Never commit this file.**

## 3. Generate `.env`

```bash
npm run db:env -- ./path/to/your-serviceAccountKey.json
# or, if the file is sitting in backend/ already:
npm run db:env
```

This writes `backend/.env` with `FIREBASE_SERVICE_ACCOUNT_B64` (the key,
base64-encoded) plus a generated `JWT_SECRET`, `JWT_EXPIRES_IN`, `NODE_ENV`,
`PORT`. `.env` is gitignored - it's never committed either.

## 4. Deploy rules + indexes ("migrate")

Requires being logged into the Firebase account that owns the project:

```bash
npx firebase-tools login
npm run db:migrate
```

This runs `firebase deploy --only firestore:rules,firestore:indexes` against
the project set in the repo root's `.firebaserc`. Index builds can take a few
minutes on a fresh project.

## 5. Seed demo data

```bash
npm run db:seed
```

Creates `demo1` / `demo2` (password `Password123!`) and 5 sample posts. Safe
to re-run - it skips users that already exist.

## 6. Run it

```bash
npm run dev        # local dev, http://localhost:4000
npm run build       # compile to dist/
npm start           # run compiled output
```

`GET /health` should return `{ "success": true, "data": { "status": "ok" } }`.

## One-liner after step 1-2

```bash
npm run db:env && npm run db:migrate && npm run db:seed && npm run dev
```

## API

See [`../project_plan.md`](../project_plan.md) §6 for the full endpoint
table and response shapes.
