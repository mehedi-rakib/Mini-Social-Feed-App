import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ok } from "../../utils/response.js";
import { addComment, listComments } from "./comments.service.js";
import { notify } from "../notifications/notification.service.js";
import type { AddCommentInput, ListCommentsQuery } from "./comments.schema.js";

export const addCommentHandler = asyncHandler(async (req: Request, res: Response) => {
  const postId = req.params.id as string;
  const { comment, postAuthorId } = await addComment(postId, req.user!.id, req.body as AddCommentInput);

  ok(res, comment, undefined, 201);

  notify({
    recipientId: postAuthorId,
    actorId: req.user!.id,
    actorUsername: req.user!.username,
    type: "comment",
    postId,
    postPreview: comment.content,
  }).catch((err) => console.error("notify failed:", err));
});

export const listCommentsHandler = asyncHandler(async (req: Request, res: Response) => {
  const { data, meta } = await listComments(req.params.id as string, req.validatedQuery as ListCommentsQuery);
  ok(res, data, meta);
});
