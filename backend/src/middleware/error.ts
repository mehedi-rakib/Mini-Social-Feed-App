import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError.js";
import { fail } from "../utils/response.js";
import { env } from "../lib/env.js";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return fail(res, err.status, err.code, err.message, err.details);
  }

  if (err instanceof ZodError) {
    return fail(res, 400, "VALIDATION_ERROR", "Validation failed", err.flatten());
  }

  console.error(err);
  const message = env.NODE_ENV === "production" ? "Internal server error" : String(err);
  return fail(res, 500, "INTERNAL", message);
}
