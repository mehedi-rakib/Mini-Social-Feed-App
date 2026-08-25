import { Router } from "express";
import { writeLimiter } from "../../middleware/rateLimit.js";
import { toggleCommentLikeHandler } from "./commentLikes.controller.js";

const router = Router({ mergeParams: true });

router.post("/", writeLimiter, toggleCommentLikeHandler);

export default router;
