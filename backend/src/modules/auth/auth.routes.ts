import { Router } from "express";
import { validateBody } from "../../middleware/validate.js";
import { requireAuth } from "../../middleware/auth.js";
import { signupLimiter, loginLimiter } from "../../middleware/rateLimit.js";
import { signupSchema, loginSchema } from "./auth.schema.js";
import { signupHandler, loginHandler, meHandler } from "./auth.controller.js";

const router = Router();

router.post("/signup", signupLimiter, validateBody(signupSchema), signupHandler);
router.post("/login", loginLimiter, validateBody(loginSchema), loginHandler);
router.get("/me", requireAuth, meHandler);

export default router;
