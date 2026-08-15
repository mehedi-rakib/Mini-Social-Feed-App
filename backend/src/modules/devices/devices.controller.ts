import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ok } from "../../utils/response.js";
import { registerDevice, unregisterDevice } from "./devices.service.js";
import type { DeviceTokenInput } from "./devices.schema.js";

export const registerDeviceHandler = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body as DeviceTokenInput;
  await registerDevice(req.user!.id, token);
  ok(res, { registered: true });
});

export const unregisterDeviceHandler = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body as DeviceTokenInput;
  await unregisterDevice(req.user!.id, token);
  ok(res, { registered: false });
});
