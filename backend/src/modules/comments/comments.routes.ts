import { Router } from "express";
import { validateBody, validateQuery } from "../../middleware/validate.js";
import { writeLimiter } from "../../middleware/rateLimit.js";
import { addCommentSchema, listCommentsQuerySchema } from "./comments.schema.js";
import { addCommentHandler, listCommentsHandler } from "./comments.controller.js";
import commentLikesRoutes from "../commentLikes/commentLikes.routes.js";

const router = Router({ mergeParams: true });

router.post("/", writeLimiter, validateBody(addCommentSchema), addCommentHandler);
router.get("/", validateQuery(listCommentsQuerySchema), listCommentsHandler);
router.use("/:commentId/like", commentLikesRoutes);

export default router;
