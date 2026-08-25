import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ok } from "../../utils/response.js";
import { toggleCommentLike } from "./commentLikes.service.js";
import { notify } from "../notifications/notification.service.js";

export const toggleCommentLikeHandler = asyncHandler(async (req: Request, res: Response) => {
  const commentId = req.params.commentId as string;
  const result = await toggleCommentLike(commentId, req.user!.id);

  ok(res, { liked: result.liked, likeCount: result.likeCount });

  if (result.liked) {
    notify({
      recipientId: result.commentAuthorId,
      actorId: req.user!.id,
      actorUsername: req.user!.username,
      type: "comment_like",
    }).catch((err) => console.error("notify failed:", err));
  }
});
