import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
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

  // Two concurrent requests racing the same unique constraint (e.g. a double
  // like-toggle tap) land here instead of surfacing as a 500.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return fail(res, 409, "CONFLICT", "That change conflicts with an existing record");
    }
    if (err.code === "P2025") {
      return fail(res, 404, "NOT_FOUND", "Record not found");
    }
  }

  console.error(err);
  const message = env.NODE_ENV === "production" ? "Internal server error" : String(err);
  return fail(res, 500, "INTERNAL", message);
}
