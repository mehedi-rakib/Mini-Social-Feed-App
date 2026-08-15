import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody, validateQuery } from "../../middleware/validate.js";
import { writeLimiter } from "../../middleware/rateLimit.js";
import { createPostSchema, listPostsQuerySchema } from "./posts.schema.js";
import { createPostHandler, listPostsHandler, getPostHandler } from "./posts.controller.js";
import likesRoutes from "../likes/likes.routes.js";
import commentsRoutes from "../comments/comments.routes.js";

const router = Router();

router.use(requireAuth);

router.get("/", validateQuery(listPostsQuerySchema), listPostsHandler);
router.post("/", writeLimiter, validateBody(createPostSchema), createPostHandler);
router.get("/:id", getPostHandler);
router.use("/:id/like", likesRoutes);
router.use("/:id/comment", commentsRoutes);
router.use("/:id/comments", commentsRoutes);

export default router;
