import { Router } from "express";
import { writeLimiter } from "../../middleware/rateLimit.js";
import { toggleLikeHandler } from "./likes.controller.js";

const router = Router({ mergeParams: true });

router.post("/", writeLimiter, toggleLikeHandler);

export default router;
