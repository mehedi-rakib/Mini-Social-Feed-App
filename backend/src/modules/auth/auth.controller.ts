import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ok } from "../../utils/response.js";
import * as authService from "./auth.service.js";
import type { SignupInput, LoginInput } from "./auth.schema.js";

export const signupHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.signup(req.body as SignupInput);
  ok(res, result, undefined, 201);
});

export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body as LoginInput);
  ok(res, result);
});

export const meHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getUserById(req.user!.id);
  ok(res, user);
});
