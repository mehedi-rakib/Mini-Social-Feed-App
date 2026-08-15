import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { env } from "./env.js";

if (!getApps().length) {
  const serviceAccount = JSON.parse(
    Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_B64, "base64").toString("utf-8")
  );

  initializeApp({
    credential: cert(serviceAccount),
  });
}

export const messaging = getMessaging();
