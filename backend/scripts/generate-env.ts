/**
 * One-time local setup: turns a downloaded Firebase service account JSON
 * (used only for FCM push notifications, not the database) into the
 * FIREBASE_SERVICE_ACCOUNT_B64 value the backend expects, and writes/updates
 * backend/.env. DATABASE_URL is left as a placeholder for MySQL - fill it in
 * yourself. Never commit the JSON file or the .env it produces - both are
 * gitignored.
 *
 * Usage:
 *   npm run db:env -- ./path/to/serviceAccountKey.json
 *   npm run db:env                # auto-detects a *firebase-adminsdk*.json in backend/
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import path from "node:path";

const backendDir = path.resolve(import.meta.dirname, "..");

function findServiceAccountFile(): string | null {
  const match = readdirSync(backendDir).find(
    (f) => f.includes("firebase-adminsdk") && f.endsWith(".json")
  );
  return match ? path.join(backendDir, match) : null;
}

const argPath = process.argv[2];
const serviceAccountPath = argPath ? path.resolve(process.cwd(), argPath) : findServiceAccountFile();

if (!serviceAccountPath || !existsSync(serviceAccountPath)) {
  console.error(
    "Could not find a service account JSON file.\n" +
      "Pass its path explicitly: npm run db:env -- ./path/to/serviceAccountKey.json\n" +
      "(Firebase Console -> Project settings -> Service accounts -> Generate new private key)"
  );
  process.exit(1);
}

const raw = readFileSync(serviceAccountPath, "utf-8");
const parsed = JSON.parse(raw);

if (!parsed.project_id || !parsed.private_key || !parsed.client_email) {
  console.error("File does not look like a Firebase service account key (missing project_id/private_key/client_email).");
  process.exit(1);
}

const b64 = Buffer.from(raw).toString("base64");

const envPath = path.join(backendDir, ".env");
const existing = existsSync(envPath) ? readFileSync(envPath, "utf-8") : "";
const lines = new Map<string, string>();

for (const line of existing.split("\n")) {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match) lines.set(match[1], match[2]);
}

lines.set("FIREBASE_SERVICE_ACCOUNT_B64", b64);
if (!lines.get("DATABASE_URL")) {
  lines.set("DATABASE_URL", "mysql://USER:PASSWORD@localhost:3306/mini_social");
}
if (!lines.get("JWT_SECRET")) {
  lines.set("JWT_SECRET", randomBytes(32).toString("base64"));
}
if (!lines.get("JWT_EXPIRES_IN")) lines.set("JWT_EXPIRES_IN", "7d");
if (!lines.get("NODE_ENV")) lines.set("NODE_ENV", "development");
if (!lines.get("PORT")) lines.set("PORT", "4000");

const output = [...lines.entries()].map(([k, v]) => `${k}=${v}`).join("\n") + "\n";
writeFileSync(envPath, output);

console.log(`Wrote ${envPath}`);
console.log(`Firebase project (FCM only): ${parsed.project_id}`);
console.log("Set DATABASE_URL to your real MySQL connection string, then run `npm run db:migrate` and `npm run db:seed`.");
