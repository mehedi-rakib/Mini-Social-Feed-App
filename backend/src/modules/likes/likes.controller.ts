import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ok } from "../../utils/response.js";
import { toggleLike } from "./likes.service.js";
import { notify } from "../notifications/notification.service.js";

export const toggleLikeHandler = asyncHandler(async (req: Request, res: Response) => {
  const postId = req.params.id as string;
  const result = await toggleLike(postId, req.user!.id);

  ok(res, { liked: result.liked, likeCount: result.likeCount });

  if (result.liked) {
    notify({
      recipientId: result.postAuthorId,
      actorId: req.user!.id,
      actorUsername: req.user!.username,
      type: "like",
      postId,
    }).catch((err) => console.error("notify failed:", err));
  }
});
