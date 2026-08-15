import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";

declare global {
  namespace Express {
    interface Request {
      // Express 5 made req.query a getter-only property, so validated query
      // results are stored here instead of reassigning req.query.
      validatedQuery?: unknown;
    }
  }
}

export function validateBody(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.body = schema.parse(req.body);
    next();
  };
}

export function validateQuery(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.validatedQuery = schema.parse(req.query);
    next();
  };
}
