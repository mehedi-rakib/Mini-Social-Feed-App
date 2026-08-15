import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { writeLimiter } from "../../middleware/rateLimit.js";
import { deviceTokenSchema } from "./devices.schema.js";
import { registerDeviceHandler, unregisterDeviceHandler } from "./devices.controller.js";

const router = Router();

router.use(requireAuth);

router.post("/", writeLimiter, validateBody(deviceTokenSchema), registerDeviceHandler);
router.delete("/", writeLimiter, validateBody(deviceTokenSchema), unregisterDeviceHandler);

export default router;
