import rateLimit, { type Options } from "express-rate-limit";
import type { Request } from "express";
import { fail } from "../utils/response.js";

// NOTE: express-rate-limit's default MemoryStore is per-instance. On Vercel's
// serverless runtime each invocation can land on a different (or cold)
// instance, so these limits are a best-effort defense, not a hard guarantee,
// unless backed by a shared store (e.g. Redis/Upstash) in production.

function keyByUserOrIp(req: Request): string {
  return req.user?.id ?? req.ip ?? "unknown";
}

const shared: Partial<Options> = {
  legacyHeaders: false,
  standardHeaders: "draft-7",
  handler: (_req, res) => {
    fail(res, 429, "RATE_LIMITED", "Too many requests, please try again later");
  },
};

// Global safety net on every /api route.
export const globalLimiter = rateLimit({
  ...shared,
  windowMs: 15 * 60 * 1000,
  limit: 300,
  keyGenerator: keyByUserOrIp,
});

// Signup: modest, per IP.
export const signupLimiter = rateLimit({
  ...shared,
  windowMs: 60 * 60 * 1000,
  limit: 10,
});

// Login: tight, per IP - the classic brute-force target.
export const loginLimiter = rateLimit({
  ...shared,
  windowMs: 15 * 60 * 1000,
  limit: 5,
});

// Writes (create post / like / comment / device register): per user once
// authenticated, falling back to IP for unauthenticated edge cases.
export const writeLimiter = rateLimit({
  ...shared,
  windowMs: 60 * 1000,
  limit: 20,
  keyGenerator: keyByUserOrIp,
});
